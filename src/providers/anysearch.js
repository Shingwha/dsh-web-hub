/**
 * AnySearch — five provider-owned tools over the hosted MCP endpoint.
 *
 * Anonymous access works for every tool at lower rate limits, so a missing key
 * is a quality-of-service choice rather than a setup error. The provider formats
 * its own search text, so this file owns that layout and nothing else.
 */

import { fetchResult, groupedSearchResult, searchResult } from '../sources.js'
import { bearer, requestHeaders } from '../transport.js'

const DOMAINS = [
  'academic', 'agriculture', 'business', 'code', 'energy', 'environment', 'film',
  'finance', 'gaming', 'general', 'health', 'ip', 'legal', 'resource', 'security',
  'social_media', 'travel',
]

/**
 * Split the provider's numbered markdown into sources: `### N. title`, then
 * `- **URL**: …`, then excerpt bullets that may end in `date: …`.
 */
function parseSources(text) {
  const sources = []
  let current
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    const heading = /^###\s+\d+\.\s+(.+)$/.exec(line)
    if (heading !== null) {
      current = { title: heading[1].trim() }
      sources.push(current)
      continue
    }
    if (current === undefined) continue
    const link = /^-\s+\*\*URL\*\*:\s+(\S+)$/.exec(line)
    if (link !== null) {
      current.url = link[1]
      continue
    }
    const bullet = /^-\s+(.+)$/.exec(line)
    if (bullet === null || current.url === undefined) continue
    const date = /\s*date:\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2})\s*$/i.exec(bullet[1])
    let excerpt = bullet[1]
    if (date !== null) {
      current.publishedAt = date[1]
      excerpt = excerpt.slice(0, date.index).trim()
    }
    if (excerpt.length === 0) continue
    current.snippet = current.snippet === undefined ? excerpt : `${current.snippet} ${excerpt}`
  }
  return sources.filter(source => typeof source.url === 'string')
}


/**
 * Split a batch response into its per-query sections. Each section repeats the
 * single-search layout under a `## Query N:` heading, so this only finds the
 * boundaries and reuses the parser above.
 */
function parseBatches(text) {
  const groups = []
  const parts = text.split(/^##\s+Query\s+\d+:\s*(.+)$/m)
  for (let index = 1; index < parts.length; index += 2) {
    const query = parts[index].trim()
    const items = parseSources(parts[index + 1] ?? '')
    if (items.length > 0) groups.push({ query, items })
  }
  return groups
}


/**
 * Attach the provider's request id to a search result.
 *
 * `anysearch_score` takes one of these ids, and the id only exists in the MCP
 * `_meta` — the text never carries it — so it has to reach the model somewhere.
 */
function withRequestIds(result, meta) {
  const one = typeof meta?.request_id === 'string' && meta.request_id.length > 0 ? meta.request_id : ''
  const many = Array.isArray(meta?.request_ids) ? meta.request_ids.filter(id => typeof id === 'string') : []
  if (one.length > 0) return { ...result, text: `${result.text}\n\nrequest_id: ${one}` }
  if (many.length === 0) return result
  const listed = many.map((id, index) => `- ${id} (query ${index + 1})`).join('\n')
  return { ...result, text: `${result.text}\n\nrequest_ids:\n${listed}` }
}

/** Read the endpoint's `{ url, title, content }` envelope into page text. */
function parsePage(text, args) {
  try {
    const page = JSON.parse(text)
    if (page !== null && typeof page === 'object' && typeof page.content === 'string') {
      const title = typeof page.title === 'string' && page.title.length > 0 ? `# ${page.title}\n\n` : ''
      const url = typeof page.url === 'string' && page.url.length > 0 ? page.url : args.url
      return fetchResult({
        text: `${title}Source: ${url}\n\n${page.content}`,
        url,
        truncated: page.content.length >= 50_000,
      })
    }
  } catch {}
  return fetchResult({ text, url: args.url })
}

export default {
  id: 'anysearch',
  title: 'AnySearch',
  host: 'anysearch.com',
  keyRequired: false,
  defaults: {
    baseURL: 'https://api.anysearch.com/mcp',
    keyRef: 'ANYSEARCH_API_KEY',
    consoleURL: 'https://www.anysearch.com/console/api-keys',
  },
  headers: key => requestHeaders('anysearch', bearer(key)),
  tools: {
    search: {
      mcp: 'search',
      card: 'search',
      description:
        'Search the web and return relevant results with title and source URL. Use one intent per call; '
        + 'for independent questions call anysearch_batch_search instead.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'One natural-language query with a single intent.' },
          max_results: {
            type: 'number', minimum: 1, maximum: 10,
            description: 'Number of results. Omit to use the provider default; at most 10.',
          },
          domain: {
            type: 'string', enum: DOMAINS,
            description: 'Vertical domain. Omit for general web search; when set, look it up with anysearch_get_sub_domains first.',
          },
          sub_domain: {
            type: 'string',
            description: 'Capability id from anysearch_get_sub_domains, such as academic.citation. Omit it to get that domain own records; set it to run one capability with sub_domain_params.',
          },
          sub_domain_params: {
            type: 'object',
            description: 'Structured params returned by anysearch_get_sub_domains for that sub-domain.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      // No count unless the caller gave one or the user pinned one: the
      // provider's own default is the better answer than a number we invented.
      args: (args, cfg) => {
        const { max_results, ...rest } = args
        const count = typeof max_results === 'number' ? max_results : cfg.maxResults
        return count > 0 ? { ...rest, max_results: count } : rest
      },
      // An unexpected payload keeps the provider's own words and no card data.
      parse: (text, { meta }) => withRequestIds(searchResult({ items: parseSources(text), raw: text }), meta),
    },

    extract: {
      mcp: 'extract',
      card: 'fetch',
      description: 'Fetch one web page and return its content as Markdown. Only HTML pages are supported; content past 50,000 characters is truncated.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      args: args => ({ url: args.url }),
      parse: (text, { args }) => parsePage(text, args),
    },

    get_sub_domains: {
      mcp: 'get_sub_domains',
      description: 'List the vertical domains and sub-domains a domain search accepts, with their parameter definitions. Call this before any search that sets a domain.',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', enum: DOMAINS, description: 'Look up one domain. Mutually exclusive with domains.' },
          domains: {
            type: 'array', items: { type: 'string', enum: DOMAINS }, maxItems: 5,
            description: 'Look up up to 5 domains in one request. Takes priority over domain.',
          },
        },
        additionalProperties: false,
      },
    },

    batch_search: {
      mcp: 'batch_search',
      card: 'search',
      description: 'Run 1-5 independent searches in parallel and return all their results. Each query follows the anysearch_search argument shape.',
      parameters: {
        type: 'object',
        properties: {
          queries: {
            type: 'array', minItems: 1, maxItems: 5,
            items: { type: 'object' },
            description: 'Search requests, each with a query and optional vertical fields.',
          },
        },
        required: ['queries'],
        additionalProperties: false,
      },
      args: args => ({ queries: args.queries }),
      // Each query keeps its own section: the card groups by it, and the model
      // reads the same grouping instead of one undifferentiated list.
      parse: (text, { meta }) => (parseBatches(text).length === 0
        ? { text }
        : withRequestIds(groupedSearchResult(parseBatches(text)), meta)),
    },

    score: {
      mcp: 'score',
      description: 'Submit quality feedback for earlier search results. Optional; every entry names a request id returned with those results.',
      parameters: {
        type: 'object',
        properties: {
          feedbacks: {
            type: 'array', minItems: 1, maxItems: 10,
            items: {
              type: 'object',
              properties: {
                request_id: { type: 'string', minLength: 1, maxLength: 64 },
                score: { type: 'integer', minimum: 1, maximum: 5 },
              },
              required: ['request_id', 'score'],
              additionalProperties: false,
            },
          },
        },
        required: ['feedbacks'],
        additionalProperties: false,
      },
      args: args => ({ feedbacks: args.feedbacks }),
    },
  },
}
