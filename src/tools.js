import { DEFAULTS } from './config.js'
import { providers, publicName } from './providers/index.js'
import { createTransport } from './transport.js'

/**
 * Provider tools are opt-in: a tool is visible only when its switch is true,
 * so installing this plugin never adds a tool the user did not ask for.
 */
export function visible(settings, name) {
  return settings.tools()[name] === true
}

/** Normalized settings of one provider, provider defaults first. */
export function providerSettings(settings, provider) {
  const value = { ...provider.defaults, ...(settings.providers()[provider.id] ?? {}) }
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
 * Normalize one tool result into the two projections every tool carries: `text`
 * is all the model reads, `meta` is the structured card data persisted with the
 * session. A bare string keeps a tool without a parser working.
 */
function normalize(result) {
  if (typeof result === 'string') return { text: result }
  const text = typeof result?.text === 'string' ? result.text : String(result?.text ?? '')
  return result?.meta === undefined ? { text } : { text, meta: result.meta }
}

/** Run one provider tool: resolve settings and credential, call, parse. */
async function run(ctx, provider, tool, settings, args, exec) {
  const cfg = providerSettings(settings, provider)
  if (cfg.baseURL.length === 0) {
    throw new Error(`${provider.title}: no endpoint configured; set providers.${provider.id}.baseURL`)
  }
  // A missing credential is only fatal when the provider says it needs one; a
  // tool that refuses keyless calls reports that in its own error, which is
  // more accurate than a guess made here.
  const key = await resolveKey(ctx, cfg.keyRef)
  if (cfg.keyRef.length > 0 && key === undefined && provider.keyRequired === true) {
    throw new Error(`${provider.title}: credential ${cfg.keyRef} is not set; add it under Keys on the Plugins page`)
  }

  const input = args ?? {}
  const send = createTransport(provider, cfg, key)
  try {
    const text = await send(tool.mcp, tool.args === undefined ? input : tool.args(input, cfg), exec.signal)
    return normalize(tool.parse === undefined ? { text } : tool.parse(text, { args: input, cfg }))
  } catch (error) {
    if (exec.signal?.aborted === true) throw error
    // A bare "fetch failed" says nothing; the cause carries the socket reason.
    const reason = error instanceof Error
      ? `${error.message}${error.cause?.code === undefined ? '' : ` (${error.cause.code})`}`
      : String(error)
    throw new Error(`${provider.title}: ${reason}`)
  }
}

/**
 * Model-facing definition of one provider tool.
 *
 * The canonical value carries both projections: `render` decides what the model
 * reads, and `presentationMeta` is persisted beside it so the conversation card
 * can replay from structure instead of re-parsing the lossy text.
 */
function definition(ctx, provider, tool, name, settings) {
  return {
    name,
    description: tool.description,
    parameters: tool.parameters,
    timeoutMs: tool.timeoutMs ?? providerSettings(settings, provider).timeoutMs,
    output: {
      schema: {
        type: 'object',
        properties: { text: { type: 'string' }, meta: { type: 'object' } },
        required: ['text'],
      },
      render: (_args, value) => [{ type: 'text', text: typeof value?.text === 'string' ? value.text : '' }],
      presentationMeta: (_args, value) => (value?.meta === undefined ? null : value.meta),
    },
    execute: (args, exec) => run(ctx, provider, tool, settings, args, exec),
  }
}

/**
 * Every tool of every provider, paired with its visibility predicate. This is
 * the only place that knows the naming rule and the switch lookup.
 */
export function toolCatalog(ctx, settings) {
  return Object.values(providers).flatMap(provider => (
    Object.entries(provider.tools).map(([key, tool]) => {
      const name = publicName(provider, key)
      return {
        definition: definition(ctx, provider, tool, name, settings),
        when: () => visible(settings, name),
      }
    })
  ))
}
