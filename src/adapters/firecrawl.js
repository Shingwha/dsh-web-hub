import { callTool } from './mcp.js'
import { fetchResult, searchResult, sources } from './sources.js'

/**
 * Firecrawl — hosted MCP. Page scraping works without a key; search may answer
 * with an explicit keyless refusal until an API key is configured.
 */

const CLIENT = 'dsh-web-hub/0.4.0'

function sender(cfg, key) {
  const headers = { 'x-firecrawl-client': CLIENT }
  if (key) headers.authorization = `Bearer ${key}`
  return (name, args, signal) => callTool({ url: cfg.baseURL, headers, name, args, signal })
}

/** Read a Firecrawl payload, turning its refusal envelope into a real error. */
function unwrap(text) {
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return undefined
  }
  if (payload?.success === false) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'the provider refused the request')
  }
  if (typeof payload?.error === 'string' && payload.error.length > 0) throw new Error(payload.error)
  return payload
}

/** @type {import('./index.js').Adapter} */
const firecrawl = {
  id: 'firecrawl',
  title: 'Firecrawl',
  keyRequired: false,
  defaults: {
    baseURL: 'https://mcp.firecrawl.dev/v2/mcp',
    keyRef: 'FIRECRAWL_API_KEY',
    consoleURL: 'https://www.firecrawl.dev/app/api-keys',
  },
  tools: {
    search: {
      description:
        'Search the web with Firecrawl and return results with title, URL, and description. '
        + 'Anonymous search is heavily rate limited; configure an API key for regular use.',
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
        const text = await sender(cfg, key)('firecrawl_search', {
          query: args.query,
          limit: typeof args.max_results === 'number' ? args.max_results : cfg.maxResults,
          objective: args.query,
        }, signal)
        const payload = unwrap(text)
        return searchResult({ items: sources(payload?.data?.web), raw: text })
      },
    },

    extract: {
      description: 'Scrape one web page with Firecrawl and return its main content as Markdown.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await sender(cfg, key)('firecrawl_scrape', {
          url: args.url,
          formats: ['markdown'],
          onlyMainContent: true,
          objective: 'Return the readable page content.',
        }, signal)
        const payload = unwrap(text)
        if (typeof payload?.markdown === 'string') {
          const title = typeof payload.metadata?.title === 'string' ? `# ${payload.metadata.title}\n\n` : ''
          return fetchResult({
            text: `${title}${args.url}\n\n${payload.markdown}`,
            url: typeof payload.metadata?.sourceURL === 'string' ? payload.metadata.sourceURL : args.url,
            statusCode: Number.isInteger(payload.metadata?.statusCode) ? payload.metadata.statusCode : 200,
          })
        }
        return fetchResult({ text, url: args.url })
      },
    },
  },
}

export default firecrawl
