import { adapters } from './adapters/index.js'
import { DEFAULTS } from './config.js'

/**
 * Public name of one adapter tool. The provider prefix keeps names unique
 * across providers, so session history and permission rules survive a switch.
 */
export function publicName(adapter, tool) {
  return `${adapter.id}_${tool}`
}

/** Normalized settings of one provider, with defaults filled in. */
export function providerSettings(settings, id) {
  const all = settings.providers()
  const value = all[id] ?? {}
  return {
    baseURL: typeof value.baseURL === 'string' ? value.baseURL.trim() : '',
    keyRef: typeof value.keyRef === 'string' ? value.keyRef.trim() : '',
    maxResults: Number.isFinite(value.maxResults) ? value.maxResults : DEFAULTS.maxResults,
    timeoutMs: Number.isFinite(value.timeoutMs) && value.timeoutMs > 0 ? value.timeoutMs : DEFAULTS.timeoutMs,
  }
}

/**
 * Whether one tool is admitted for the current model step.
 *
 * Every known tool is registered once and admitted by this predicate, so a
 * saved switch needs neither a restart nor a re-registration: an unadmitted
 * tool costs no tokens and cannot be called.
 */
export function admitted(settings, adapter, tool, name) {
  if (settings.active() !== adapter.id) return false
  const value = settings.tools()[name]
  return typeof value === 'boolean' ? value : tool.defaultOn === true
}

/** Resolve a configured credential reference, or undefined when it is unset. */
async function resolveKey(ctx, ref) {
  if (ref.length === 0) return undefined
  const hit = await ctx.credentials.resolve(ref)
  return typeof hit?.value === 'string' && hit.value.length > 0 ? hit.value : undefined
}

/**
 * Run one adapter tool. The adapter owns the contract; this only resolves the
 * provider's live settings and credential, then normalizes the failure text.
 */
async function execute(ctx, adapter, tool, settings, args, exec) {
  const provider = providerSettings(settings, adapter.id)
  if (provider.baseURL.length === 0) {
    throw new Error(`${adapter.title}: baseURL is empty; set providers.${adapter.id}.baseURL in the dsh-web-hub config`)
  }
  // A missing credential is only fatal when the provider says it needs one.
  // Providers that allow anonymous access keep working without a key.
  const key = await resolveKey(ctx, provider.keyRef)
  if (provider.keyRef.length > 0 && key === undefined && adapter.keyRequired === true) {
    throw new Error(`${adapter.title}: credential ${provider.keyRef} is not set and this provider requires one; fill it in on the Plugins page`)
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
    timeoutMs: providerSettings(settings, adapter.id).timeoutMs,
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : String(value ?? '') }],
    },
    execute: (args, exec) => execute(ctx, adapter, tool, settings, args, exec),
  }
}

/**
 * Every tool of every adapter, paired with its admission predicate.
 * This is the single place that knows the naming and admission rules.
 */
export function toolSet(ctx, settings) {
  return Object.values(adapters).flatMap((adapter) => (
    Object.entries(adapter.tools).map(([tool, spec]) => {
      const name = publicName(adapter, tool)
      return {
        definition: definition(ctx, adapter, spec, name, settings),
        when: () => admitted(settings, adapter, spec, name),
      }
    })
  ))
}
