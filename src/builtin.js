/**
 * Mask the built-in `web_search` and `web_fetch` while the hub is loaded.
 *
 * They belong to the agent preset, so they cannot be unregistered from here:
 * the plugin masks them per agent with `ctx.tools.restrict()` and keeps a guard
 * as a backstop during the registration window. Both effects are owned by the
 * plugin, so unloading it restores the tools.
 *
 * The flag is read live: the guard always reflects the current setting, and the
 * masks are reconciled whenever the setting changes or an agent appears.
 */

const TOOLS = ['web_search', 'web_fetch']
const RETRY_LIMIT = 40
const NAMESPACE = 'web-hub'

const REASON =
  'The built-in web tools are turned off because dsh-web-hub supplies search and fetch. '
  + 'Call the provider tool instead (for example anysearch_search or anysearch_extract), '
  + 'or turn off "Hide built-in web tools" on the Plugins page.'

/**
 * @param ctx - plugin context.
 * @param settings - live config readers; `hideBuiltinWeb()` is read on every check.
 * @returns a disposer that lifts the guard and every mask.
 */
export function hideBuiltinWeb(ctx, settings) {
  const enabled = () => settings.hideBuiltinWeb()

  const stopGuard = ctx.tools.guard((exec) => (
    enabled() && TOOLS.includes(exec.name) ? REASON : undefined
  ))

  const agents = new Map()

  /** Bring one agent's mask in line with the current flag. */
  const reconcile = (agent, record) => {
    if (agents.get(agent) !== record) return true

    if (!enabled()) {
      record.stopRetry?.()
      record.stopRetry = undefined
      try {
        record.release?.()
      } catch {}
      record.release = undefined
      record.hidden = false
      return true
    }

    if (record.hidden) return true
    try {
      record.release = agent.ctx.tools.restrict({ deny: TOOLS })
      record.hidden = true
      record.stopRetry?.()
      record.stopRetry = undefined
      return true
    } catch (error) {
      if (!/unknown global tool/.test(String(error))) {
        ctx.logger?.warn?.(`dsh-web-hub: cannot mask the built-in web tools: ${String(error)}`)
        record.hidden = true
        return true
      }
      // The preset registers these tools while the agent is assembled, so an
      // unknown name retries on the next registry change.
      if (record.stopRetry !== undefined) return false
      let attempts = 0
      record.stopRetry = ctx.on('tools/change', () => {
        attempts += 1
        if (agents.get(agent) !== record || attempts > RETRY_LIMIT || reconcile(agent, record)) {
          record.stopRetry?.()
          record.stopRetry = undefined
        }
      })
      return false
    }
  }

  const track = (agent) => {
    if (agents.has(agent)) return
    const record = { hidden: false, release: undefined, stopRetry: undefined }
    agents.set(agent, record)
    reconcile(agent, record)
  }

  const forget = (agent) => {
    const record = agents.get(agent)
    if (record === undefined) return
    record.stopRetry?.()
    agents.delete(agent)
  }

  const resync = () => {
    for (const [agent, record] of agents) reconcile(agent, record)
  }

  const listens = [
    ctx.on('agent/created', ({ agent }) => track(agent)),
    ctx.on('agent/disposed', ({ agent }) => forget(agent)),
    ctx.on('app-boot/config-reload', resync),
    ctx.on('settings/document-updated', (ns) => {
      if (String(ns).includes(NAMESPACE)) resync()
    }),
  ]

  for (const agent of ctx.agents.list()) track(agent)

  return () => {
    for (const dispose of listens) {
      try {
        dispose()
      } catch {}
    }
    stopGuard()
    for (const record of agents.values()) {
      record.stopRetry?.()
      try {
        record.release?.()
      } catch {}
    }
    agents.clear()
  }
}
