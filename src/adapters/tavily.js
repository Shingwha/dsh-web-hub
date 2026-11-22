import { callTool } from './mcp.js'
import { fetchResult, searchResult, sources } from './sources.js'

/**
 * Tavily — hosted MCP. Keyless access is selected by a header and is rate
 * limited per day; an API key switches to the account's limits without
 * changing any tool.
 */

const CLIENT = 'dsh-web-hub/0.4.0'

function sender(cfg, key) {
  const headers = { 'x-tavily-client': CLIENT }
  if (key) headers.authorization = `Bearer ${key}`
  else headers['x-tavily-access-mode'] = 'keyless'
  return (name, args, signal) => callTool({ url: cfg.baseURL, headers, name, args, signal })
}

/**
 * Tavily reports a keyless daily cap as a normal JSON payload rather than an
 * error, so surface it as one instead of handing the model a code blob.
 */
function unwrap(text) {
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return undefined
  }
  const code = payload?.code
  if (typeof code === 'string' && code.length > 0) {
    const retry = typeof payload.retry_after === 'number' ? ` (retry after ${payload.retry_after}s)` : ''
    throw new Error(`${code}${retry}: ${payload.message ?? 'request refused'}`)
  }
  return payload
}


/**
 * Read a Tavily list payload into sources. Crawl returns pages and map returns
 * URLs; both answer with a `results` array, whose items may be strings or
 * objects, so this narrows either shape and leaves an unknown one empty.
 */
function listSources(text) {
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return []
  }
  const list = Array.isArray(payload?.results) ? payload.results
    : Array.isArray(payload?.urls) ? payload.urls
      : Array.isArray(payload?.data) ? payload.data : []
  return sources(list.map(item => (typeof item === 'string' ? { url: item } : {
    url: item?.url,
    title: item?.title ?? item?.metadata?.title,
    snippet: item?.raw_content ?? item?.content ?? item?.markdown,
  })))
}

/** @type {import('./index.js').Adapter} */
const tavily = {
  id: 'tavily',
  title: 'Tavily',
  keyRequired: false,
  defaults: {
    baseURL: 'https://mcp.tavily.com/mcp/',
    keyRef: 'TAVILY_API_KEY',
    consoleURL: 'https://app.tavily.com',
  },
  tools: {
    search: {
      description:
        'Search the web with Tavily and return ranked results with title, URL, and a content excerpt. '
        + 'Use one focused query per call.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'One natural-language query.' },
          max_results: {
            type: 'number', minimum: 1, maximum: 20,
            description: 'Number of results. Defaults to the configured value.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await sender(cfg, key)('tavily_search', {
          query: args.query,
          max_results: typeof args.max_results === 'number' ? args.max_results : cfg.maxResults,
        }, signal)
        const payload = unwrap(text)
        return searchResult({
          items: sources(payload?.results),
          answer: payload?.answer,
          raw: text,
        })
      },
    },

    extract: {
      description: 'Extract the main content of one web page with Tavily and return it as Markdown.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await sender(cfg, key)('tavily_extract', {
          urls: [args.url],
          format: 'markdown',
        }, signal)
        const payload = unwrap(text)
        const page = Array.isArray(payload?.results) ? payload.results[0] : undefined
        if (page && typeof page.raw_content === 'string') {
          return fetchResult({ text: `${args.url}\n\n${page.raw_content}`, url: args.url })
        }
        const failed = Array.isArray(payload?.failed_results) ? payload.failed_results[0] : undefined
        if (failed) throw new Error(failed.error ?? 'extraction failed')
        return fetchResult({ text, url: args.url })
      },
    },

    crawl: {
      description:
        'Crawl a site from one root URL with Tavily and return the pages it extracted, with configurable depth, '
        + 'breadth, and result count. Needs a Tavily API key; keyless access covers search and extract only.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Root URL to begin the crawl.' },
          max_depth: { type: 'integer', minimum: 1, description: 'How far from the root the crawler may explore.' },
          max_breadth: { type: 'integer', minimum: 1, description: 'Links followed per level of the tree.' },
          limit: { type: 'integer', minimum: 1, description: 'Total links processed before stopping.' },
          instructions: { type: 'string', description: 'Guidance on which kinds of pages to return.' },
          select_paths: {
            type: 'array', items: { type: 'string' },
            description: 'Regexes that keep matching URL paths, such as /docs/.*.',
          },
          select_domains: {
            type: 'array', items: { type: 'string' },
            description: 'Regexes that restrict crawling to matching domains.',
          },
          allow_external: { type: 'boolean', description: 'Return external links in the response.' },
          extract_depth: {
            type: 'string', enum: ['basic', 'advanced'],
            description: 'Advanced also extracts tables and embedded content, at higher latency.',
          },
          format: { type: 'string', enum: ['markdown', 'text'], description: 'Format of each page body.' },
          include_favicon: { type: 'boolean', description: 'Include each page favicon URL.' },
          chunks_per_source: {
            type: 'integer', minimum: 1, maximum: 5,
            description: 'Chunks per source; requires instructions.',
          },
        },
        required: ['url'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await sender(cfg, key)('tavily_crawl', args, signal)
        return searchResult({ items: listSources(text), raw: text })
      },
    },

    map: {
      description:
        'Map a site structure from one root URL with Tavily and return the URLs it found. Needs a Tavily API key; '
        + 'keyless access covers search and extract only.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Root URL to begin the mapping.' },
          max_depth: { type: 'integer', minimum: 1, description: 'How far from the root the traversal may explore.' },
          max_breadth: { type: 'integer', minimum: 1, description: 'Links followed per level of the tree.' },
          limit: { type: 'integer', minimum: 1, description: 'Total links processed before stopping.' },
          instructions: { type: 'string', description: 'Guidance on which URLs to keep.' },
          select_paths: {
            type: 'array', items: { type: 'string' },
            description: 'Regexes that keep matching URL paths, such as /docs/.*.',
          },
          select_domains: {
            type: 'array', items: { type: 'string' },
            description: 'Regexes that restrict traversal to matching domains.',
          },
          allow_external: { type: 'boolean', description: 'Return external links in the response.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await sender(cfg, key)('tavily_map', args, signal)
        return searchResult({ items: listSources(text), raw: text })
      },
    },

    research: {
      description:
        'Run one multi-source research task with Tavily and return its written answer. Slower and more expensive '
        + 'than a search; use it for synthesis, not a list of pages. Needs a Tavily API key.',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string', description: 'A complete description of the research task.' },
          model: {
            type: 'string', enum: ['mini', 'pro', 'auto'],
            description: 'mini suits narrow tasks with few subtopics; pro suits broad ones.',
          },
          files: {
            type: 'array', maxItems: 5,
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'File name, such as notes.md.' },
                data: { type: 'string', description: 'Base64-encoded file content.' },
                type: { type: 'string', enum: ['base64'] },
              },
              required: ['name', 'data'],
              additionalProperties: false,
            },
            description: 'Base64 .txt/.md/.json attachments, up to 80,000 words combined.',
          },
        },
        required: ['input'],
        additionalProperties: false,
      },
      run: ({ cfg, key, args, signal }) => sender(cfg, key)('tavily_research', args, signal),
    },
  },
}

export default tavily
