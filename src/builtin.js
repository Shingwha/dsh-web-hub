/**
 * Hide the built-in `web_search` and `web_fetch` tools while the hub is loaded.
 *
 * They are registered by the agent preset, so this plugin cannot unregister
 * them; it masks them per agent with `ctx.tools.restrict()` and keeps a guard as
 * a backstop for any call that slips through the registration window. Both
 * effects are owned by the plugin, so unloading the hub restores the tools.
 */

const HIDDEN_TOOLS = ['web_search', 'web_fetch']
const RETRY_LIMIT = 40

const GUARD_REASON =
  'The built-in web tools are turned off because dsh-web-hub supplies search and fetch. '
  + 'Call the provider tool instead (for example anysearch_search or anysearch_extract), '
  + 'or turn off "Hide built-in web tools" on the Plugins page.'

/**
 * Install the guard and the per-agent masks.
 * @param ctx - plugin context.
 * @param enabled - the `hideBuiltinWeb` flag; false installs nothing.
 * @returns a disposer that lifts both effects.
 */
export function hideBuiltinWeb(ctx, enabled) {
  if (!enabled) return () => {}

  const stopGuard = ctx.tools.guard((exec) => (HIDDEN_TOOLS.includes(exec.name) ? GUARD_REASON : undefined))
  const records = new Map()

  /**
   * Apply the mask to one agent. The preset registers these tools while the
   * agent is being assembled, so an unknown name schedules a retry on the next
   * registry change instead of failing the plugin.
   */
  const mask = (agent, record) => {
    if (records.get(agent) !== record) return true
    try {
      record.unrestrict = agent.ctx.tools.restrict({ deny: HIDDEN_TOOLS })
      record.hidden = true
      record.stopRetry?.()
      record.stopRetry = undefined
      return true
    } catch (error) {
      if (!/unknown global tool/.test(String(error))) {
        ctx.logger?.warn?.(`dsh-web-hub: cannot hide the built-in web tools for an agent: ${String(error)}`)
        record.hidden = true
        return true
      }
      if (record.stopRetry !== undefined) return false
      let attempts = 0
      record.stopRetry = ctx.on('tools/change', () => {
        attempts += 1
        if (records.get(agent) !== record || attempts > RETRY_LIMIT || mask(agent, record)) {
          record.stopRetry?.()
          record.stopRetry = undefined
        }
      })
      return false
    }
  }

  const admit = (agent) => {
    if (records.has(agent)) return
    const record = { hidden: false, unrestrict: undefined, stopRetry: undefined }
    records.set(agent, record)
    mask(agent, record)
  }

  const release = (agent) => {
    const record = records.get(agent)
    if (record === undefined) return
    record.stopRetry?.()
    records.delete(agent)
  }

  const listenCreated = ctx.on('agent/created', ({ agent }) => admit(agent))
  const listenDisposed = ctx.on('agent/disposed', ({ agent }) => release(agent))
  for (const agent of ctx.agents.list()) admit(agent)

  return () => {
    listenCreated()
    listenDisposed()
    stopGuard()
    for (const record of records.values()) {
      record.stopRetry?.()
      try {
        record.unrestrict?.()
      } catch {}
    }
    records.clear()
  }
}
