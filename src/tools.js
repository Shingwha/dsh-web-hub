import { adapters } from './adapters/index.js'
import { DEFAULTS } from './config.js'

/**
 * Provider tools are opt-in: a tool is visible only when its switch is true,
 * so installing this plugin never adds a tool the user did not ask for.
 */
export function visible(settings, name) {
  return settings.tools()[name] === true
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

/**
 * Normalize one adapter result into the two projections every tool now carries:
 * `text` is all the model reads, `meta` is the structured card data persisted
 * with the session. A bare string keeps an adapter that predates cards working.
 */
function normalize(result) {
  if (typeof result === 'string') return { text: result }
  const text = typeof result?.text === 'string' ? result.text : String(result?.text ?? '')
  const meta = result?.meta
  return meta === undefined ? { text } : { text, meta }
}

/** Run one adapter tool, resolving the provider's live settings and credential. */
async function run(ctx, adapter, tool, settings, args, exec) {
  const provider = providerSettings(settings, adapter)
  if (provider.baseURL.length === 0) {
    throw new Error(`${adapter.title}: no endpoint configured; set providers.${adapter.id}.baseURL`)
  }
  // A missing credential is only fatal when the provider says it needs one; a
  // tool that refuses keyless calls reports that in its own error, which is
  // more accurate than a guess made here.
  const key = await resolveKey(ctx, provider.keyRef)
  if (provider.keyRef.length > 0 && key === undefined && adapter.keyRequired === true) {
    throw new Error(`${adapter.title}: credential ${provider.keyRef} is not set; add it under Keys on the Plugins page`)
  }
  try {
    return normalize(await tool.run({ cfg: provider, key, args: args ?? {}, signal: exec.signal }))
  } catch (error) {
    if (exec.signal?.aborted === true) throw error
    throw new Error(`${adapter.title}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Model-facing definition of one adapter tool.
 *
 * The canonical value carries both projections: `render` decides what the model
 * reads, and `presentationMeta` is persisted beside it so the conversation card
 * can replay from structure instead of re-parsing the lossy text.
 */
function definition(ctx, adapter, tool, name, settings) {
  return {
    name,
    description: tool.description,
    parameters: tool.parameters,
    timeoutMs: providerSettings(settings, adapter).timeoutMs,
    output: {
      schema: {
        type: 'object',
        properties: { text: { type: 'string' }, meta: { type: 'object' } },
        required: ['text'],
      },
      render: (_args, value) => [{ type: 'text', text: typeof value?.text === 'string' ? value.text : '' }],
      presentationMeta: (_args, value) => (value?.meta === undefined ? null : value.meta),
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
        when: () => visible(settings, name),
      }
    })
  ))
}
