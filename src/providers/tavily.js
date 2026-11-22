/**
 * Tavily — hosted MCP with keyless search and extract.
 *
 * Keyless access is selected by a header and is capped per day; crawl, map, and
 * research need a key. Responses are JSON, so this file only narrows them.
 */

import { fetchResult, searchResult, sources } from '../sources.js'
import { bearer, requestHeaders } from '../transport.js'

/**
 * Tavily reports a keyless cap as a normal payload rather than an HTTP failure,
 * so surface its `code` as an error instead of handing the model a JSON blob.
 */
function unwrap(text) {
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return undefined
  }
  if (typeof payload?.code === 'string' && payload.code.length > 0) {
    const retry = typeof payload.retry_after === 'number' ? ` (retry after ${payload.retry_after}s)` : ''
    throw new Error(`${payload.code}${retry}: ${payload.message ?? 'request refused'}`)
  }
  return payload
}

/**
 * Read a Tavily list payload into sources. Crawl returns pages and map returns
 * URLs; both answer with a `results` array whose items may be strings or
 * objects, so this narrows either shape and leaves an unknown one empty.
 */
function listSources(text) {
  const payload = (() => {
    try {
      return JSON.parse(text)
    } catch {
      return undefined
    }
  })()
  const list = Array.isArray(payload?.results) ? payload.results
    : Array.isArray(payload?.urls) ? payload.urls
      : Array.isArray(payload?.data) ? payload.data : []
  return sources(list.map(item => (typeof item === 'string' ? { url: item } : {
    url: item?.url,
    title: item?.title ?? item?.metadata?.title,
    snippet: item?.raw_content ?? item?.content ?? item?.markdown,
  })))
}

export default {
  id: 'tavily',
  title: 'Tavily',
  host: 'tavily.com',
  keyRequired: false,
  defaults: {
    baseURL: 'https://mcp.tavily.com/mcp/',
    keyRef: 'TAVILY_API_KEY',
    consoleURL: 'https://app.tavily.com',
  },
  headers: key => requestHeaders('tavily', key
    ? bearer(key)
    : { 'x-tavily-access-mode': 'keyless' }),
  tools: {
    search: {
      mcp: 'tavily_search',
      card: 'search',
      description:
        'Search the web with Tavily and return ranked results with title, URL, and a content excerpt. '
        + 'Use one focused query per call.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'One natural-language query.' },
          max_results: {
            type: 'number', minimum: 1, maximum: 20,
            description: 'Number of results. Omit to use the provider default.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      args: (args, cfg) => {
        const count = typeof args.max_results === 'number' ? args.max_results : cfg.maxResults
        return count > 0 ? { query: args.query, max_results: count } : { query: args.query }
      },
      parse: (text) => {
        const payload = unwrap(text)
        // Tavily names the publication time `published_date`; project it here
        // rather than teaching the shared mapping a provider alias.
        const items = sources((Array.isArray(payload?.results) ? payload.results : []).map(item => ({
          url: item?.url,
          title: item?.title,
          snippet: item?.content ?? item?.raw_content,
          publishedAt: item?.published_date ?? item?.publishedDate,
        })))
        return searchResult({ items, answer: payload?.answer, raw: text })
      },
    },

    extract: {
      mcp: 'tavily_extract',
      card: 'fetch',
      description: 'Extract the main content of one web page with Tavily and return it as Markdown.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      args: args => ({ urls: [args.url], format: 'markdown' }),
      parse: (text, { args }) => {
        const payload = unwrap(text)
        const page = Array.isArray(payload?.results) ? payload.results[0] : undefined
        if (page !== undefined && typeof page.raw_content === 'string') {
          return fetchResult({ text: `${args.url}\n\n${page.raw_content}`, url: args.url })
        }
        const failed = Array.isArray(payload?.failed_results) ? payload.failed_results[0] : undefined
        if (failed !== undefined) throw new Error(failed.error ?? 'extraction failed')
        return fetchResult({ text, url: args.url })
      },
    },

    crawl: {
      mcp: 'tavily_crawl',
      card: 'search',
      needsKey: true,
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
      parse: text => searchResult({ items: listSources(text), raw: text }),
    },

    map: {
      mcp: 'tavily_map',
      card: 'search',
      needsKey: true,
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
      parse: text => searchResult({ items: listSources(text), raw: text }),
    },

    research: {
      mcp: 'tavily_research',
      needsKey: true,
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
      // The report is an answer plus its sources, which is the search shape:
      // readable text for the model, one source list for the card data.
      parse: (text) => {
        const payload = unwrap(text)
        if (typeof payload?.content !== 'string' || payload.content.length === 0) return { text }
        return searchResult({ items: sources(payload.sources), answer: payload.content })
      },
    },
  },
}
