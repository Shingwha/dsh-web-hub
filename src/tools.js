import { DEFAULTS, toolEnabled } from './config.js'

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
 * Resolve a configured credential reference.
 * @returns the secret value, or undefined when the reference does not resolve.
 */
async function resolveKey(ctx, ref) {
  if (ref.length === 0) return undefined
  const hit = await ctx.credentials.resolve(ref)
  return typeof hit?.value === 'string' && hit.value.length > 0 ? hit.value : undefined
}

/**
 * Build the model-facing definitions for one provider's enabled tools.
 *
 * The public name is always `<provider>_<tool>`: stable across providers, safe
 * with several providers registered, and self-describing in session history.
 *
 * @param ctx - plugin context (credential access).
 * @param adapter - the selected provider.
 * @param provider - its normalized settings.
 * @param switches - the row config's `tools` map.
 * @returns definitions ready for `ctx.tools.register`.
 */
export function buildToolDefinitions(ctx, adapter, provider, switches) {
  const definitions = []
  for (const [tool, spec] of Object.entries(adapter.tools)) {
    const name = `${adapter.id}_${tool}`
    if (!toolEnabled(switches, name, spec.defaultOn === true)) continue
    definitions.push({
      name,
      description: spec.description,
      parameters: spec.parameters,
      timeoutMs: provider.timeoutMs,
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : String(value ?? '') }],
      },
      async execute(args, exec) {
        if (provider.baseURL.length === 0) {
          throw new Error(`${adapter.title}: baseURL is empty; set providers.${adapter.id}.baseURL in the dsh-web-hub config`)
        }
        // A missing credential is only fatal when the provider says it needs one.
        // Providers that allow anonymous access (AnySearch does, at lower limits)
        // keep working and simply send no Authorization header.
        const key = await resolveKey(ctx, provider.keyRef)
        if (provider.keyRef.length > 0 && key === undefined && adapter.keyRequired === true) {
          throw new Error(`${adapter.title}: credential ${provider.keyRef} is not set and this provider requires one; fill it in on the Plugins page (Web sources)`)
        }
        try {
          return await spec.run({ cfg: provider, key, args: args ?? {}, signal: exec.signal })
        } catch (error) {
          if (exec.signal?.aborted === true) throw error
          throw new Error(`${adapter.title}: ${error instanceof Error ? error.message : String(error)}`)
        }
      },
    })
  }
  return definitions
}
