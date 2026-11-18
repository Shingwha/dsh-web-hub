import { callTool } from './mcp.js'

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

/** Turn one result list into the numbered text the model reads. */
function formatResults(title, items) {
  const lines = items.map((item, index) => {
    const head = `${index + 1}. ${item.title ?? item.url ?? ''}`
    const url = item.url ? `\n   ${item.url}` : ''
    const body = item.content ?? item.raw_content ?? ''
    const excerpt = typeof body === 'string' && body.length > 0 ? `\n   ${body.slice(0, 500).replace(/\n+/g, ' ')}` : ''
    return head + url + excerpt
  })
  return `${title}\n\n${lines.join('\n\n')}`
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

/** @type {import('./index.js').Adapter} */
const tavily = {
  id: 'tavily',
  title: 'Tavily',
  keyRequired: false,
  tools: {
    search: {
      defaultOn: true,
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
        if (Array.isArray(payload?.results)) {
          const answer = typeof payload.answer === 'string' && payload.answer.length > 0 ? `${payload.answer}\n\n` : ''
          return answer + formatResults('Search results', payload.results)
        }
        return text
      },
    },

    extract: {
      defaultOn: true,
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
          return `${args.url}\n\n${page.raw_content}`
        }
        const failed = Array.isArray(payload?.failed_results) ? payload.failed_results[0] : undefined
        if (failed) throw new Error(failed.error ?? 'extraction failed')
        return text
      },
    },
  },
}

export default tavily
