import z from '@deepseek-ai/schemastery'

/**
 * Settings applied when a provider omits them.
 *
 * `maxResults: 0` means "do not ask for a count" — every provider then answers
 * with its own default, which is what the model should see unless the user
 * deliberately pins a number.
 */
export const DEFAULTS = {
  maxResults: 0,
  timeoutMs: 30_000,
}

/**
 * Two mappings, nothing else:
 *
 * - `providers` — per-service connection and credential settings, never secrets
 * - `tools`    — one switch per model-facing tool, built-ins included
 *
 * A tool is visible exactly when its switch is on, so the panel and the runtime
 * share one rule. Both fields are volatile: the settings service only projects
 * volatile fields, and a saved switch must apply on the next model step.
 */
export const Config = z.object({
  providers: z.dict(z.object({
    title: z.string().default(''),
    baseURL: z.string().default(''),
    keyRef: z.string().default(''),
    consoleURL: z.string().default(''),
    maxResults: z.number().min(0).default(DEFAULTS.maxResults).description('Results to request; 0 lets the provider use its own default.'),
    timeoutMs: z.number().default(DEFAULTS.timeoutMs),
  })).default({}).volatile().description(
    'Per-service settings keyed by provider id.',
  ),
  tools: z.dict(z.boolean()).default({}).volatile().description(
    'One switch per tool, keyed by its model-facing name (web_search, exa_search, …).',
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

/** Fresh readers over the row config; nothing is snapshotted. */
export function readers(config) {
  const value = config ?? {}
  return {
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
