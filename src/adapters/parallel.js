/**
 * Parallel — hosted MCP at https://mcp.parallel.ai/mcp.
 *
 * Keyless access covers search, fetch, image search (fast mode) and the typed
 * tools; a key adds `web_research`, raises every limit, and is the only way to
 * send `x-parallel-mcp-config`, which is how the result count is set. An
 * anonymous connection therefore always receives the provider's default count.
 *
 * Tool names here are contracts: the hub prefixes them with `parallel_`.
 */

import { callTool } from './mcp.js'

/**
 * Call one tool. Search and image search pass their result count through the
 * config header, since the endpoint accepts it only on authenticated calls.
 */
function call(cfg, key, name, args, signal, maxResults) {
  const headers = {}
  if (key) {
    headers.authorization = `Bearer ${key}`
    if (typeof maxResults === 'number') {
      headers['x-parallel-mcp-config'] = JSON.stringify({
        [name]: { override: { advanced_settings: { max_results: maxResults } } },
      })
    }
  }
  return callTool({ url: cfg.baseURL, headers, name, args, signal })
}

/** Blank out undefined fields, which the endpoint would otherwise see as nulls. */
function compact(args) {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => value !== undefined))
}

/**
 * Read one JSON result envelope. Returns undefined when the payload is not the
 * shape we know, so the caller can hand the raw text through untouched.
 */
function results(text) {
  try {
    const payload = JSON.parse(text)
    return Array.isArray(payload?.results) ? payload.results : undefined
  } catch {
    return undefined
  }
}

/** Render results as numbered entries: title, source, then the excerpts. */
function render(items, label) {
  const entries = items.map((item, index) => {
    const title = typeof item?.title === 'string' && item.title.length > 0 ? item.title : '(untitled)'
    const lines = [`${index + 1}. ${title}`]
    if (typeof item?.url === 'string' && item.url.length > 0) lines.push(`   ${item.url}`)
    const body = typeof item?.full_content === 'string' && item.full_content.length > 0
      ? item.full_content
      : Array.isArray(item?.excerpts) ? item.excerpts.filter(text => typeof text === 'string').join('\n\n') : ''
    if (body.length > 0) lines.push('', body)
    return lines.join('\n')
  })
  return `${label}\n\n${entries.join('\n\n')}`
}

/** @type {import('./index.js').Adapter} */
const parallel = {
  id: 'parallel',
  title: 'Parallel',
  // Keyless search and fetch work; only research refuses without a credential,
  // so this stays false and the tool that needs one says so itself.
  keyRequired: false,
  defaults: {
    baseURL: 'https://mcp.parallel.ai/mcp',
    keyRef: 'PARALLEL_API_KEY',
    consoleURL: 'https://platform.parallel.ai',
    maxResults: 8,
    // Research runs a whole question against the web, so its tool overrides
    // this with a longer limit; the fast tools finish well inside it.
    timeoutMs: 60_000,
  },
  tools: {
    search: {
      description:
        'Search the web with Parallel and return results with title, URL, and excerpts that usually answer '
        + 'the question without a second fetch. Write a goal-style objective, then 2-3 short keyword queries '
        + 'of 3-6 words each; never repeat the question as the only query. Use one intent per call.',
      parameters: {
        type: 'object',
        properties: {
          objective: {
            type: 'string',
            description: 'One goal for this search: what to find, and any recency or source preference.',
          },
          search_queries: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: { type: 'string', minLength: 2 },
            description: '1-3 keyword queries of 3-6 words each. No quoted phrases; `site:` takes a bare domain.',
          },
          max_results: {
            type: 'number', minimum: 1, maximum: 20,
            description: 'Number of results. Needs an API key; keyless calls get the provider default of 10.',
          },
        },
        required: ['objective', 'search_queries'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await call(cfg, key, 'web_search', {
          objective: args.objective,
          search_queries: args.search_queries,
        }, signal, typeof args.max_results === 'number' ? args.max_results : cfg.maxResults)
        const items = results(text)
        return items === undefined ? text : render(items, 'Search results')
      },
    },

    fetch: {
      description:
        'Fetch specific pages with Parallel and return the relevant parts of each one, or the whole page as '
        + 'Markdown when full_content is set. Use it only when search excerpts are not enough.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
          objective: {
            type: 'string',
            description: 'What to look for on the page, up to 200 characters. Omit to receive the full content.',
          },
          full_content: {
            type: 'boolean',
            description: 'Return the whole page as Markdown instead of relevant parts. A long page can be very large.',
          },
          search_queries: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: { type: 'string', minLength: 2 },
            description: '1-3 short keyword queries that focus the excerpts. Pass the same ones a search used.',
          },
        },
        required: ['url'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await call(cfg, key, 'web_fetch', compact({
          urls: [args.url],
          objective: args.objective,
          search_queries: args.search_queries,
          full_content: args.full_content,
        }), signal)
        const items = results(text)
        return items === undefined ? text : render(items, 'Page content')
      },
    },

    research: {
      description:
        'Ask Parallel one research question and receive an answer with citations in the same call. Much slower '
        + 'and longer than a search; use it when results need synthesis, not a list of pages. '
        + 'Needs the Parallel API key, and reports that itself when the key is missing.',
      timeoutMs: 180_000,
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            maxLength: 20_000,
            description: 'The research question, including every constraint the answer must respect.',
          },
          reasoning_effort: {
            type: 'string', enum: ['low', 'medium', 'high', 'auto'],
            description: 'How much effort to spend. Omit and the provider picks one for the question.',
          },
          previous_response_id: {
            type: 'string',
            description: 'The response id from an earlier research call to continue it; the new question may build on that answer.',
          },
        },
        required: ['input'],
        additionalProperties: false,
      },
      run: ({ cfg, key, args, signal }) => call(cfg, key, 'web_research', compact({
        input: args.input,
        reasoning_effort: args.reasoning_effort,
        previous_response_id: args.previous_response_id,
      }), signal),
    },

    image_search: {
      description:
        'Find images on the web with Parallel and return direct image URLs with the page each appears on and '
        + 'its title. Results link to images; they do not describe them.',
      parameters: {
        type: 'object',
        properties: {
          objective: {
            type: 'string',
            description: 'What the images should show, including subject, style, or context that ranks them.',
          },
          search_queries: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: { type: 'string', minLength: 2 },
            description: '1-3 short keyword queries of 3-6 words each.',
          },
          mode: {
            type: 'string', enum: ['fast', 'advanced'],
            description: 'Advanced mode needs an API key; keyless connections are limited to fast.',
          },
        },
        required: ['objective', 'search_queries'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await call(cfg, key, 'image_search', compact({
          objective: args.objective,
          search_queries: args.search_queries,
          mode: args.mode,
        }), signal, cfg.maxResults)
        return text
      },
    },
  },
}

export default parallel
