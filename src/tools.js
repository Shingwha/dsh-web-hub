import { providerConfig, toolEnabled } from './config.js'

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
 * Whether this tool is admitted for the current model step.
 *
 * Every known tool is registered once; admission is decided per step from the
 * live config, so switching source or flipping a tool switch takes effect on
 * the next step without re-registering anything.
 *
 * @param settings - live config readers.
 * @param adapter - the provider that owns the tool.
 * @param tool - the adapter's tool declaration.
 * @param name - public tool name, `<provider>_<tool>`.
 */
export function isToolAdmitted(settings, adapter, tool, name) {
  if (settings.active() !== adapter.id) return false
  return toolEnabled(settings.tools(), name, tool.defaultOn === true)
}

/**
 * Define one model-facing tool for an adapter.
 *
 * The adapter owns the description, schema and implementation; this function
 * only adapts it to the tool registry contract and resolves the provider's
 * settings and credential at call time.
 *
 * @param ctx - plugin context (credential access).
 * @param adapter - the provider that owns the tool.
 * @param tool - the adapter's tool declaration.
 * @param name - public tool name, `<provider>_<tool>`.
 * @param settings - live config readers.
 */
export function defineTool(ctx, adapter, tool, name, settings) {
  return {
    name,
    description: tool.description,
    parameters: tool.parameters,
    timeoutMs: providerConfig(settings.providers()[adapter.id]).timeoutMs,
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : String(value ?? '') }],
    },
    async execute(args, exec) {
      const provider = providerConfig(settings.providers()[adapter.id])
      if (provider.baseURL.length === 0) {
        throw new Error(`${adapter.title}: baseURL is empty; set providers.${adapter.id}.baseURL in the dsh-web-hub config`)
      }
      // A missing credential is only fatal when the provider says it needs one.
      // Providers that allow anonymous access (AnySearch does) keep working and
      // simply send no Authorization header.
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
    },
  }
}
