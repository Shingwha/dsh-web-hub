import { Config, readers } from './src/config.js'
import { toolCatalog } from './src/tools.js'
import { applyBuiltinSwitches } from './src/builtin.js'

export { Config }

export const name = 'dsh-web-hub'

/**
 * The hub owns no model-facing tool of its own. It mounts the tools every
 * adapter declares, and it masks the two built-in web tools according to the
 * same switch map, so one panel decides everything the model can see.
 */
export const inject = ['tools', 'agents', 'credentials']

export function apply(ctx, config) {
  const settings = readers(config)

  ctx.effect(() => applyBuiltinSwitches(ctx, settings), 'dsh-web-hub: built-in web tools')

  ctx.effect(() => {
    const disposers = toolCatalog(ctx, settings).map(({ definition, when }) => (
      ctx.tools.register(definition, { when })
    ))
    return () => {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {}
      }
    }
  }, 'dsh-web-hub: provider tools')
}
