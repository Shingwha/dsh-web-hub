/**
 * AnySearch adapter — five provider-owned tools over the hosted MCP endpoint.
 *
 * The adapter owns its tool names, descriptions and JSON Schemas; the hub only
 * prefixes the provider id and decides which of them are mounted. Transport is
 * the shared MCP helper, so this file is contracts plus argument mapping.
 */

import { callTool } from './mcp.js'

const CLIENT_HEADER = 'dsh-web-hub/0.4.0'

const DOMAINS = [
  'academic', 'agriculture', 'business', 'code', 'energy', 'environment', 'film',
  'finance', 'gaming', 'general', 'health', 'ip', 'legal', 'resource', 'security',
  'social_media', 'travel',
]

/** One request sender for this provider: endpoint, headers, shared client. */
function send(cfg, key) {
  const headers = { 'x-anysearch-client': CLIENT_HEADER }
  if (key) headers.authorization = `Bearer ${key}`
  return (name, args, signal) => callTool({ url: cfg.baseURL, headers, name, args, signal })
}

/** @type {import('./index.js').Adapter} */
const anysearch = {
  id: 'anysearch',
  title: 'AnySearch',
  // Anonymous access works for every tool at lower rate limits, so a missing key
  // is a quality-of-service choice rather than a setup error.
  keyRequired: false,
  defaults: {
    baseURL: 'https://api.anysearch.com/mcp',
    keyRef: 'ANYSEARCH_API_KEY',
    consoleURL: 'https://www.anysearch.com/console/api-keys',
  },
  tools: {
    search: {
      defaultOn: true,
      description:
        'Search the web and return relevant results with title and source URL. Use one intent per call; '
        + 'for independent questions call anysearch_batch_search instead.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'One natural-language query with a single intent.' },
          max_results: {
            type: 'number', minimum: 1, maximum: 10,
            description: 'Number of results. Defaults to the configured value, at most 10.',
          },
          domain: {
            type: 'string', enum: DOMAINS,
            description: 'Vertical domain. Omit for general search; when set, look it up with anysearch_get_sub_domains first.',
          },
          sub_domain: {
            type: 'string',
            description: 'Vertical sub-domain returned by anysearch_get_sub_domains. Only used together with a domain.',
          },
          sub_domain_params: {
            type: 'object',
            description: 'Structured params returned by anysearch_get_sub_domains for that sub-domain.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      run: ({ cfg, key, args, signal }) => send(cfg, key)('search', {
        ...args,
        max_results: typeof args.max_results === 'number' ? args.max_results : cfg.maxResults,
      }, signal),
    },

    extract: {
      defaultOn: true,
      description: 'Fetch one web page and return its content as Markdown. Only HTML pages are supported; content past 50,000 characters is truncated.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Full page URL starting with http:// or https://.' },
        },
        required: ['url'],
        additionalProperties: false,
      },
      run: async ({ cfg, key, args, signal }) => {
        const text = await send(cfg, key)('extract', { url: args.url }, signal)
        // The endpoint answers with a JSON envelope { url, title, content } where
        // `content` is Markdown; hand the model the page, not the envelope.
        try {
          const page = JSON.parse(text)
          if (page && typeof page.content === 'string') {
            const title = typeof page.title === 'string' && page.title.length > 0 ? `# ${page.title}\n\n` : ''
            const source = typeof page.url === 'string' && page.url.length > 0 ? `Source: ${page.url}\n\n` : ''
            return title + source + page.content
          }
        } catch {}
        return text
      },
    },

    get_sub_domains: {
      defaultOn: false,
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
      run: ({ cfg, key, args, signal }) => send(cfg, key)('get_sub_domains', args, signal),
    },

    batch_search: {
      defaultOn: false,
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
      run: ({ cfg, key, args, signal }) => send(cfg, key)('batch_search', { queries: args.queries }, signal),
    },

    score: {
      defaultOn: false,
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
      run: ({ cfg, key, args, signal }) => send(cfg, key)('score', { feedbacks: args.feedbacks }, signal),
    },
  },
}

export default anysearch
