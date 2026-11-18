import { Config, readers } from './src/config.js'
import { toolSet } from './src/registry.js'
import { hideBuiltinWeb } from './src/builtin.js'

export { Config }

export const name = 'dsh-web-hub'

/**
 * The hub owns no tools of its own: it mounts the tools adapters declare, and
 * optionally masks the built-in web tools so the model sees one search stack.
 */
export const inject = ['tools', 'agents', 'credentials']

export function apply(ctx, config) {
  const settings = readers(config)

  ctx.effect(() => hideBuiltinWeb(ctx, settings), 'dsh-web-hub: built-in web tools')

  ctx.effect(() => {
    const disposers = toolSet(ctx, settings).map(({ definition, when }) => (
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
