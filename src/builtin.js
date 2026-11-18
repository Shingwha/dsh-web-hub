/**
 * The built-in web tools belong to the agent preset, so this plugin cannot
 * unregister them. It masks each one per agent while its switch is off, and
 * keeps a guard as a backstop for the registration window.
 *
 * They share the same switch map as provider tools, so the panel needs no
 * special case: `web_search: false` means the model does not see it.
 */

const BUILTINS = ['web_search', 'web_fetch']
const RETRY_LIMIT = 40

const REASON =
  'This built-in web tool is turned off in dsh-web-hub. '
  + 'Use one of the enabled provider tools instead, or switch it back on under Plugins → dsh-web-hub.'

/** @returns a disposer that lifts the guard and every mask. */
export function applyBuiltinSwitches(ctx, settings) {
  // Built-ins are the opposite default: on unless the user switched one off, so
  // installing this plugin never removes a tool that already worked.
  const enabled = (name) => settings.tools()[name] !== false
  const denied = () => BUILTINS.filter((name) => !enabled(name))

  const stopGuard = ctx.tools.guard((exec) => (denied().includes(exec.name) ? REASON : undefined))
  const agents = new Map()

  /** Release the previous mask and apply the one the current switches describe. */
  const reconcile = (agent, record) => {
    if (agents.get(agent) !== record) return true

    record.stopRetry?.()
    record.stopRetry = undefined
    if (record.release !== undefined) {
      try {
        record.release()
      } catch {}
      record.release = undefined
    }

    const deny = denied()
    if (deny.length === 0) return true

    try {
      record.release = agent.ctx.tools.restrict({ deny })
      return true
    } catch (error) {
      if (!/unknown global tool/.test(String(error))) {
        ctx.logger?.warn?.(`dsh-web-hub: cannot mask the built-in web tools: ${String(error)}`)
        return true
      }
      // The preset registers these tools while the agent is assembled, so an
      // unknown name retries on the next registry change.
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
    const record = { release: undefined, stopRetry: undefined }
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
      if (String(ns).includes('web-hub')) resync()
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
