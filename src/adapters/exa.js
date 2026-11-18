import { callTool } from './mcp.js'

/**
 * Exa — hosted MCP, no API key required.
 * Tools: web_search_exa (search), web_fetch_exa (page → text).
 */

const CLIENT = 'dsh-web-hub/0.4.0'

function sender(cfg, key) {
  const headers = { 'x-exa-client': CLIENT }
  if (key) headers.authorization = `Bearer ${key}`
  return (name, args, signal) => callTool({ url: cfg.baseURL, headers, name, args, signal })
}

/** @type {import('./index.js').Adapter} */
const exa = {
  id: 'exa',
  title: 'Exa',
  keyRequired: false,
  defaults: {
    baseURL: 'https://mcp.exa.ai/mcp',
    keyRef: 'EXA_API_KEY',
    consoleURL: 'https://dashboard.exa.ai/api-keys',
  },
  tools: {
    search: {
      description:
        'Search the web with Exa and return results with title, URL, and page highlights. '
        + 'Use one focused query per call.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'One natural-language query.' },
          max_results: {
            type: 'number', minimum: 1, maximum: 25,
            description: 'Number of results. Defaults to the configured value.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      run: ({ cfg, key, args, signal }) => sender(cfg, key)('web_search_exa', {
        query: args.query,
        numResults: typeof args.max_results === 'number' ? args.max_results : cfg.maxResults,
        objective: args.query,
      }, signal),
    },

    extract: {
      description: 'Fetch pages with Exa and return their text content. Accepts one URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      run: ({ cfg, key, args, signal }) => sender(cfg, key)('web_fetch_exa', {
        urls: [args.url],
        maxCharacters: 50_000,
      }, signal),
    },
  },
}

export default exa
