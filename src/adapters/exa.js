import { callTool } from './mcp.js'
import { fetchResult, searchResult } from './sources.js'

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


/**
 * Split Exa's formatted text into sources. Its MCP tool renders one block per
 * result as `Title:` / `URL:` / `Published:` / `Author:` / `Highlights:` lines,
 * so this is the only place that knows that layout.
 */
function parseSources(text) {
  const items = []
  for (const block of text.split(/^Title:\s*/m).slice(1)) {
    const lines = block.split(/\r?\n/)
    const title = lines[0].trim()
    const urlLine = lines.find(line => line.startsWith('URL:'))
    if (urlLine === undefined) continue
    const url = urlLine.slice(4).trim()
    if (url.length === 0) continue
    const publishedLine = lines.find(line => line.startsWith('Published:'))
    const published = publishedLine === undefined ? '' : publishedLine.slice(10).trim()
    const highlight = lines.findIndex(line => line.startsWith('Highlights:'))
    const body = highlight === -1 ? '' : lines.slice(highlight + 1).join(' ').trim()
    items.push({
      url,
      ...title.length > 0 ? { title } : {},
      ...body.length > 0 ? { snippet: body.slice(0, 800) } : {},
      ...published.length > 0 && !/^n\/a$/i.test(published) ? { publishedAt: published } : {},
    })
  }
  return items
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
      run: async ({ cfg, key, args, signal }) => {
        const text = await sender(cfg, key)('web_search_exa', {
          query: args.query,
          numResults: typeof args.max_results === 'number' ? args.max_results : cfg.maxResults,
          objective: args.query,
        }, signal)
        return searchResult({ items: parseSources(text), raw: text })
      },
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
      run: async ({ cfg, key, args, signal }) => {
        const text = await sender(cfg, key)('web_fetch_exa', {
          urls: [args.url],
          maxCharacters: 50_000,
        }, signal)
        return fetchResult({ text, url: args.url, truncated: text.length >= 50_000 })
      },
    },
  },
}

export default exa
