/**
 * The adapter registry — the only extension point.
 *
 * Adding a search or fetch service means adding one module and one line below.
 * The hub, the panel and the config shape stay untouched: an adapter owns its
 * tools' names, descriptions, schemas and implementations.
 *
 * @typedef {object} Adapter
 * @property {string} id Provider id; also the public tool name prefix.
 * @property {string} title Display name used in errors and the tool list.
 * @property {boolean} [keyRequired] True when the provider cannot run without a
 *   credential. Default false: a configured-but-missing key falls back to
 *   anonymous or keyless access instead of failing the call.
 * @property {Record<string, AdapterTool>} tools Tools this provider owns.
 *
 * @typedef {object} AdapterTool
 * @property {string} description Model-facing description.
 * @property {object} parameters JSON Schema for the arguments.
 * @property {(input: { cfg: object, key?: string, args: any, signal: AbortSignal }) => Promise<string>} run
 */

import anysearch from './anysearch.js'
import exa from './exa.js'
import firecrawl from './firecrawl.js'
import tavily from './tavily.js'

export const adapters = {
  [anysearch.id]: anysearch,
  [exa.id]: exa,
  [firecrawl.id]: firecrawl,
  [tavily.id]: tavily,
}
