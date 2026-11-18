import z from '@deepseek-ai/schemastery'

/** Settings applied when a provider omits them. */
export const DEFAULTS = {
  maxResults: 8,
  timeoutMs: 30_000,
}

/**
 * The row config is the whole control plane:
 *
 * - `active`         the one provider whose tools are mounted ('' mounts none)
 * - `tools`          per-tool switches keyed by public tool name
 * - `providers`      provider-owned settings, never secrets
 * - `hideBuiltinWeb` masks the built-in web tools while this plugin is loaded
 *
 * Every field is volatile. The settings service only projects volatile fields —
 * a non-volatile Config yields no namespace at all — and volatility is also what
 * lets a saved switch apply on the next model step instead of a restart.
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
    consoleURL: z.string().default(''),
    maxResults: z.number().default(DEFAULTS.maxResults),
    timeoutMs: z.number().default(DEFAULTS.timeoutMs),
  })).default({}).volatile().description(
    'Per-provider settings; only the provider named by `active` is mounted.',
  ),
  tools: z.dict(z.boolean()).default({}).volatile().description(
    'Per-tool switches keyed by public tool name, e.g. anysearch_search.',
  ),
})

/**
 * Read one field, which is a live reference for a volatile field and a plain
 * value when the plugin is composed outside the settings layer.
 */
function read(field, fallback) {
  const value = field !== null && typeof field === 'object' && typeof field.get === 'function'
    ? field.get()
    : field
  return value === undefined || value === null ? fallback : value
}

/**
 * Fresh readers over the row config. Nothing is snapshotted: a saved switch is
 * visible to the next read, which is the next model step.
 */
export function readers(config) {
  const value = config ?? {}
  return {
    active: () => {
      const active = read(value.active, '')
      return typeof active === 'string' ? active.trim() : ''
    },
    hideBuiltinWeb: () => read(value.hideBuiltinWeb, true) !== false,
    providers: () => {
      const providers = read(value.providers, {})
      return typeof providers === 'object' ? providers : {}
    },
    tools: () => {
      const switches = read(value.tools, {})
      return typeof switches === 'object' ? switches : {}
    },
  }
}
