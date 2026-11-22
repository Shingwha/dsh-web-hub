/**
 * Firecrawl — hosted MCP whose scrape endpoint works without a key.
 *
 * Search and scrape answer with JSON envelopes, so this file narrows them; the
 * model-facing text and the card data come from the shared shaping.
 */

import { fetchResult, searchResult, sources } from '../sources.js'
import { bearer, requestHeaders } from '../transport.js'

/** Turn a refusal envelope into a real error instead of a payload. */
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

export default {
  id: 'firecrawl',
  title: 'Firecrawl',
  host: 'firecrawl.dev',
  keyRequired: false,
  defaults: {
    baseURL: 'https://mcp.firecrawl.dev/v2/mcp',
    keyRef: 'FIRECRAWL_API_KEY',
    consoleURL: 'https://www.firecrawl.dev/app/api-keys',
    timeoutMs: 60_000,
  },
  headers: key => requestHeaders('firecrawl', bearer(key)),
  tools: {
    search: {
      mcp: 'firecrawl_search',
      card: 'search',
      description:
        'Search the web with Firecrawl and return results with title, URL, and description. '
        + 'Anonymous search is heavily rate limited; configure an API key for regular use.',
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
        return count > 0 ? { query: args.query, limit: count } : { query: args.query }
      },
      parse: (text) => {
        const payload = unwrap(text)
        return searchResult({ items: sources(payload?.data?.web), raw: text })
      },
    },

    extract: {
      mcp: 'firecrawl_scrape',
      card: 'fetch',
      description: 'Scrape one web page with Firecrawl and return its main content as Markdown.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      // Only what the output contract needs: markdown, main content.
      args: args => ({ url: args.url, formats: ['markdown'], onlyMainContent: true }),
      parse: (text, { args }) => {
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
