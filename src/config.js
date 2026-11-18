import z from '@deepseek-ai/schemastery'

/**
 * The row config is the entire control plane.
 *
 * - `active`        picks exactly one provider; an empty string mounts nothing.
 * - `providers`     holds provider-owned settings, never secrets.
 * - `tools`         is the per-tool switchboard keyed by the public tool name.
 * - `hideBuiltinWeb` masks the built-in web tools while this plugin is loaded.
 *
 * Every field is volatile. That is what makes the configuration surface exist
 * at all — the settings service only projects fields that can change without
 * remounting the plugin — and it lets a saved switch take effect on the next
 * model step instead of restarting the plugin.
 */
export const Config = z.object({
  active: z.string().default('anysearch').volatile().description(
    'Provider id whose tools are mounted. Empty turns every hub tool off.',
  ),
  hideBuiltinWeb: z.boolean().default(true).volatile().description(
    'Hide the built-in web_search and web_fetch tools while this plugin is loaded.',
  ),
  providers: z.dict(z.object({
    baseURL: z.string().default(''),
    keyRef: z.string().default(''),
    maxResults: z.number().default(8),
    timeoutMs: z.number().default(30000),
  })).default({}).volatile().description(
    'Per-provider settings; only the provider named by `active` is mounted.',
  ),
  tools: z.dict(z.boolean()).default({}).volatile().description(
    'Per-tool switches keyed by public tool name, e.g. anysearch_search.',
  ),
})

export const DEFAULTS = {
  maxResults: 8,
  timeoutMs: 30000,
}

/**
 * A volatile config field arrives as a live reference; a plain value is also
 * accepted so the plugin still works when composed without the settings layer.
 * @param value - config field or plain value.
 * @param fallback - value used when the field is absent.
 */
export function deref(value, fallback) {
  if (value !== null && typeof value === 'object' && typeof value.get === 'function') {
    const current = value.get()
    return current === undefined ? fallback : current
  }
  return value === undefined ? fallback : value
}

/**
 * Live readers for the row config. Every read is fresh, so a saved switch is
 * visible to the next model step without restarting anything.
 * @param config - resolved plugin config.
 */
export function live(config) {
  const value = config ?? {}
  return {
    active: () => {
      const active = deref(value.active, 'anysearch')
      return typeof active === 'string' ? active.trim() : ''
    },
    hideBuiltinWeb: () => deref(value.hideBuiltinWeb, true) !== false,
    providers: () => {
      const providers = deref(value.providers, {})
      return providers !== null && typeof providers === 'object' ? providers : {}
    },
    tools: () => {
      const switches = deref(value.tools, {})
      return switches !== null && typeof switches === 'object' ? switches : {}
    },
  }
}

/**
 * Normalize one provider's settings so every tool sees the same shape.
 * @param provider - the `providers.<id>` entry from the row config.
 */
export function providerConfig(provider) {
  const value = provider ?? {}
  return {
    baseURL: typeof value.baseURL === 'string' ? value.baseURL.trim() : '',
    keyRef: typeof value.keyRef === 'string' ? value.keyRef.trim() : '',
    maxResults: Number.isFinite(value.maxResults) ? value.maxResults : DEFAULTS.maxResults,
    timeoutMs: Number.isFinite(value.timeoutMs) && value.timeoutMs > 0 ? value.timeoutMs : DEFAULTS.timeoutMs,
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
