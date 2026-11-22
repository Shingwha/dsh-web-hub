/**
 * Exa — hosted MCP, usable without a key.
 *
 * Its search tool renders results as `Title:` / `URL:` / `Published:` /
 * `Author:` / `Highlights:` lines rather than JSON, so this file owns that
 * layout. Everything else is the shared shaping.
 */

import { fetchResult, searchResult } from '../sources.js'
import { bearer, requestHeaders } from '../transport.js'

/**
 * Split Exa's formatted text into sources. One block starts at each `Title:`
 * line and carries the URL and the publication date among its fields.
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

export default {
  id: 'exa',
  title: 'Exa',
  host: 'exa.ai',
  keyRequired: false,
  defaults: {
    baseURL: 'https://mcp.exa.ai/mcp',
    keyRef: 'EXA_API_KEY',
    consoleURL: 'https://dashboard.exa.ai/api-keys',
  },
  headers: key => requestHeaders('exa', bearer(key)),
  tools: {
    search: {
      mcp: 'web_search_exa',
      card: 'search',
      description:
        'Search the web with Exa and return results with title, URL, and page highlights. '
        + 'Use one focused query per call.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'One natural-language query.' },
          max_results: {
            type: 'number', minimum: 1, maximum: 25,
            description: 'Number of results. Omit to use the provider default.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      args: (args, cfg) => {
        const count = typeof args.max_results === 'number' ? args.max_results : cfg.maxResults
        return count > 0 ? { query: args.query, numResults: count } : { query: args.query }
      },
      parse: text => searchResult({ items: parseSources(text), raw: text }),
    },

    extract: {
      mcp: 'web_fetch_exa',
      card: 'fetch',
      description: 'Fetch pages with Exa and return their text content. Accepts one URL.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      args: args => ({ urls: [args.url], maxCharacters: 50_000 }),
      parse: (text, { args }) => fetchResult({ text, url: args.url, truncated: text.length >= 50_000 }),
    },
  },
}
