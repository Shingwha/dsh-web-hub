/**
 * 元宝搜索 (Tencent Yuanbao Search) — one hosted MCP tool, `SearchPro`.
 *
 * The endpoint answers with the cloud API's own envelope: a `Pages` array whose
 * entries are JSON strings, plus `Version` and `RequestId`. A missing or disabled
 * service comes back as an `Error` object inside the same envelope rather than an
 * HTTP failure, so this file unwraps both.
 */

import { searchResult, source } from '../sources.js'
import { bearer, requestHeaders } from '../transport.js'

/** The `Cnt` field only accepts these values. */
const COUNTS = [10, 20, 30, 40, 50]

/** Round a requested count up to the nearest size the endpoint accepts. */
function countArg(value) {
  if (!(value > 0)) return undefined
  return COUNTS.find(size => size >= value) ?? COUNTS[COUNTS.length - 1]
}

/** Read the `{"Response": {...}}` envelope, or throw its error. */
function unwrap(text) {
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    return undefined
  }
  const response = payload?.Response ?? payload
  if (response?.Error !== undefined) {
    const code = response.Error.Code ?? 'Error'
    throw new Error(`${code}: ${response.Error.Message ?? 'the request was refused'}`)
  }
  return response
}

/** One `Pages` entry: a JSON string, or already an object. */
function pageOf(entry) {
  if (typeof entry !== 'string') return entry
  try {
    return JSON.parse(entry)
  } catch {
    return undefined
  }
}

export default {
  id: 'yuanbao',
  title: '元宝搜索',
  host: 'yuanbao.tencent.com',
  keyRequired: true,
  defaults: {
    baseURL: 'https://api.wsa.cloud.tencent.com/Mcp',
    keyRef: 'WSA_API_KEY',
    consoleURL: 'https://console.cloud.tencent.com/wsapi/index?tab=apikey',
  },
  headers: key => requestHeaders('yuanbao', bearer(key)),
  tools: {
    search: {
      mcp: 'SearchPro',
      card: 'search',
      needsKey: true,
      description:
        'Search the web with Tencent Yuanbao Search, which indexes Chinese and global pages and can narrow by site, '
        + 'recency and vertical. Needs a Yuanbao Search API key from the Tencent Cloud console.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'One natural-language query, at most about 500 characters.' },
          max_results: {
            type: 'number', minimum: 1, maximum: 50,
            description: 'Results to ask for; the endpoint accepts 10, 20, 30, 40 or 50 and the request rounds up. Omit to use its default.',
          },
          site: {
            type: 'string',
            description: 'Restrict to one site, such as zhihu.com, or exclude sites with "exclude:a.com|b.com".',
          },
          freshness: {
            type: 'string',
            description: 'Recency window: dN for the last N days, mN for months, yN for years (for example d7, m3, y1).',
          },
          industry: {
            type: 'string', enum: ['gov', 'news', 'acad', 'finance'],
            description: 'Vertical: government, news, academic or finance.',
          },
          mode: {
            type: 'integer', enum: [0, 1, 2],
            description: '0 for public pages, 1 for authoritative vertical answers, 2 for both. Omit to use the default.',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      args: (args, cfg) => {
        const count = countArg(typeof args.max_results === 'number' ? args.max_results : cfg.maxResults)
        return {
          Query: args.query,
          ...typeof args.site === 'string' && args.site.length > 0 ? { Site: args.site } : {},
          ...typeof args.freshness === 'string' && args.freshness.length > 0 ? { Freshness: args.freshness } : {},
          ...typeof args.industry === 'string' && args.industry.length > 0 ? { Industry: args.industry } : {},
          ...Number.isInteger(args.mode) ? { Mode: args.mode } : {},
          ...count === undefined ? {} : { Cnt: count },
        }
      },
      parse: (text) => {
        const response = unwrap(text)
        if (response === undefined) return { text }
        const items = (Array.isArray(response.Pages) ? response.Pages : [])
          .map(pageOf)
          .map(page => source({
            url: page?.url,
            title: page?.title,
            snippet: page?.passage ?? page?.content,
            publishedAt: page?.date,
            favicon: page?.favicon,
          }))
          .filter(item => item !== undefined)
        return searchResult({ items, raw: text })
      },
    },
  },
}
