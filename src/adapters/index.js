/**
 * Adapter registry — the only extension point.
 *
 * Adding a search or fetch service means adding one module here and registering
 * it below. The hub, the panel and the config shape stay untouched: an adapter
 * owns its tools' names, descriptions, schemas and implementations.
 *
 * @typedef {object} Adapter
 * @property {string} id Provider id; also the public tool name prefix.
 * @property {string} title Display name shown in the panel and the tool list.
 * @property {boolean} [keyRequired] True when the provider cannot run without a
 *   credential. Default false: a configured-but-missing key falls back to
 *   anonymous access instead of failing the call.
 * @property {Record<string, string>} [summary] Localized one-line description.
 * @property {Record<string, AdapterTool>} tools Tools this provider owns.
 *
 * @typedef {object} AdapterTool
 * @property {boolean} [defaultOn] Mounted unless the `tools` switch says otherwise.
 * @property {string} description Model-facing description.
 * @property {object} parameters JSON Schema for the arguments.
 * @property {(input: { cfg: object, key: string | undefined, args: any, signal: AbortSignal }) => Promise<string>} run
 */

import anysearch from './anysearch.js'

/** Every known provider, keyed by id. */
export const adapters = {
  [anysearch.id]: anysearch,
}

/**
 * Look up one provider.
 * @param id - provider id from the row config.
 * @returns the adapter, or undefined when the id is unknown.
 */
export function adapterFor(id) {
  return typeof id === 'string' && Object.hasOwn(adapters, id) ? adapters[id] : undefined
}

/** Provider ids in registration order, for the panel. */
export function adapterIds() {
  return Object.keys(adapters)
}
