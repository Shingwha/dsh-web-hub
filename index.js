import { adapters } from './src/adapters/index.js'
import { Config, live } from './src/config.js'
import { defineTool, isToolAdmitted } from './src/tools.js'
import { hideBuiltinWeb } from './src/builtin.js'

export { Config }

export const name = 'dsh-web-hub'

/**
 * The hub mounts provider-owned tools and, optionally, hides the built-in web
 * tools. It registers nothing itself: every model-facing tool comes from an
 * adapter, prefixed with that provider's id.
 */
export const inject = ['tools', 'agents', 'credentials']

export function apply(ctx, config) {
  const settings = live(config)

  ctx.effect(() => hideBuiltinWeb(ctx, settings), 'dsh-web-hub: built-in web tools')

  // Every known tool is registered once and admitted per model step by its
  // `when` condition, so a saved switch needs no restart and no re-registration.
  ctx.effect(() => {
    const disposers = []
    for (const adapter of Object.values(adapters)) {
      for (const [tool, spec] of Object.entries(adapter.tools)) {
        const publicName = `${adapter.id}_${tool}`
        const definition = defineTool(ctx, adapter, spec, publicName, settings)
        disposers.push(ctx.tools.register(definition, {
          when: () => isToolAdmitted(settings, adapter, spec, publicName),
        }))
      }
    }
    return () => {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {}
      }
    }
  }, 'dsh-web-hub: provider tools')
}
