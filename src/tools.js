import { adapters } from './adapters/index.js'
import { DEFAULTS } from './config.js'

/**
 * One rule for the whole plugin: a tool is visible exactly when its switch is
 * on. A tool with no stored switch falls back to the adapter's own default, so
 * a newly added tool needs no config edit.
 */
export function visible(settings, name, defaultOn) {
  const value = settings.tools()[name]
  return typeof value === 'boolean' ? value : defaultOn === true
}

/** Public name of one adapter tool: `<provider>_<tool>`, unique across providers. */
function publicName(adapter, tool) {
  return `${adapter.id}_${tool}`
}

/** Normalized settings of one provider, adapter defaults first. */
export function providerSettings(settings, adapter) {
  const value = { ...adapter.defaults, ...(settings.providers()[adapter.id] ?? {}) }
  return {
    baseURL: typeof value.baseURL === 'string' ? value.baseURL.trim() : '',
    keyRef: typeof value.keyRef === 'string' ? value.keyRef.trim() : '',
    consoleURL: typeof value.consoleURL === 'string' ? value.consoleURL.trim() : '',
    maxResults: Number.isFinite(value.maxResults) ? value.maxResults : DEFAULTS.maxResults,
    timeoutMs: Number.isFinite(value.timeoutMs) && value.timeoutMs > 0 ? value.timeoutMs : DEFAULTS.timeoutMs,
  }
}

/** Resolve a configured credential reference, or undefined when it is unset. */
async function resolveKey(ctx, ref) {
  if (ref.length === 0) return undefined
  const hit = await ctx.credentials.resolve(ref)
  return typeof hit?.value === 'string' && hit.value.length > 0 ? hit.value : undefined
}

/** Run one adapter tool, resolving the provider's live settings and credential. */
async function run(ctx, adapter, tool, settings, args, exec) {
  const provider = providerSettings(settings, adapter)
  if (provider.baseURL.length === 0) {
    throw new Error(`${adapter.title}: no endpoint configured; set providers.${adapter.id}.baseURL`)
  }
  // A missing credential is only fatal when the provider says it needs one.
  const key = await resolveKey(ctx, provider.keyRef)
  if (provider.keyRef.length > 0 && key === undefined && adapter.keyRequired === true) {
    throw new Error(`${adapter.title}: credential ${provider.keyRef} is not set; add it under Keys on the Plugins page`)
  }
  try {
    return await tool.run({ cfg: provider, key, args: args ?? {}, signal: exec.signal })
  } catch (error) {
    if (exec.signal?.aborted === true) throw error
    throw new Error(`${adapter.title}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** Model-facing definition of one adapter tool. */
function definition(ctx, adapter, tool, name, settings) {
  return {
    name,
    description: tool.description,
    parameters: tool.parameters,
    timeoutMs: providerSettings(settings, adapter).timeoutMs,
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : String(value ?? '') }],
    },
    execute: (args, exec) => run(ctx, adapter, tool, settings, args, exec),
  }
}

/**
 * Every tool of every adapter, paired with its visibility predicate. This is
 * the only place that knows the naming rule and the switch lookup.
 */
export function toolCatalog(ctx, settings) {
  return Object.values(adapters).flatMap((adapter) => (
    Object.entries(adapter.tools).map(([tool, spec]) => {
      const name = publicName(adapter, tool)
      return {
        definition: definition(ctx, adapter, spec, name, settings),
        when: () => visible(settings, name, spec.defaultOn),
      }
    })
  ))
}
