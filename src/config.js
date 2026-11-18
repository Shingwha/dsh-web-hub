import z from '@deepseek-ai/schemastery'

/**
 * The row config is the entire control plane.
 *
 * - `active`   picks exactly one provider; an empty string mounts nothing.
 * - `providers` holds provider-owned settings, never secrets.
 * - `tools`    is the per-tool switchboard keyed by the public tool name
 *              (`<provider>_<tool>`), so a provider can expose a subset.
 *
 * Every field is a normal (non-volatile) field: saving restarts this plugin so
 * `apply` rebuilds the mounted tool set. That keeps "what the model sees" and
 * "what the config says" identical at all times, with no partial states.
 */
export const Config = z.object({
  active: z.string().default('anysearch').description(
    'Provider id whose tools are mounted. Empty turns every hub tool off.',
  ),
  hideBuiltinWeb: z.boolean().default(true).description(
    'Hide the built-in web_search and web_fetch tools while this plugin is loaded.',
  ),
  providers: z.dict(z.object({
    baseURL: z.string().default(''),
    keyRef: z.string().default(''),
    maxResults: z.number().default(8),
    timeoutMs: z.number().default(30000),
  })).default({}).description(
    'Per-provider settings; only the provider named by `active` is mounted.',
  ),
  tools: z.dict(z.boolean()).default({}).description(
    'Per-tool switches keyed by public tool name, e.g. anysearch_search.',
  ),
})

export const DEFAULTS = {
  maxResults: 8,
  timeoutMs: 30000,
}

/**
 * Read the row config into the plain shape the runtime consumes.
 * @param config - validated row config, possibly `undefined` on a bare row.
 * @returns the selected provider (or undefined), its settings, and the switch map.
 */
export function resolve(config) {
  const value = config ?? {}
  const providers = value.providers ?? {}
  const active = typeof value.active === 'string' ? value.active.trim() : ''
  const provider = active.length > 0 && Object.hasOwn(providers, active) ? providers[active] : undefined
  return {
    active: provider === undefined ? '' : active,
    provider: provider ?? {},
    tools: value.tools ?? {},
    hideBuiltinWeb: value.hideBuiltinWeb !== false,
  }
}

/**
 * Whether one public tool name is switched on. An absent entry keeps the
 * adapter's own default, so a newly added tool needs no config edit.
 * @param switches - the `tools` map from the row config.
 * @param name - public tool name, `<provider>_<tool>`.
 * @param fallback - the adapter's default for this tool.
 */
export function toolEnabled(switches, name, fallback) {
  const value = switches[name]
  return typeof value === 'boolean' ? value : fallback
}
