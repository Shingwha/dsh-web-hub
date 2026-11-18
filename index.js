import { Config, resolve } from './src/config.js'
import { adapterFor } from './src/adapters/index.js'
import { buildToolDefinitions, providerConfig } from './src/tools.js'
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
  const settings = resolve(config)

  ctx.effect(() => hideBuiltinWeb(ctx, settings.hideBuiltinWeb), 'dsh-web-hub: built-in web tools')

  const adapter = adapterFor(settings.active)
  if (adapter === undefined) {
    ctx.logger?.info?.(
      settings.active === ''
        ? 'dsh-web-hub: no provider selected; no tools mounted'
        : `dsh-web-hub: unknown provider "${settings.active}"; no tools mounted`,
    )
    return
  }

  const provider = providerConfig(settings.provider)
  ctx.effect(() => {
    const definitions = buildToolDefinitions(ctx, adapter, provider, settings.tools)
    const disposers = definitions.map((definition) => ctx.tools.register(definition))
    return () => {
      for (const dispose of disposers) {
        try {
          dispose()
        } catch {}
      }
    }
  }, 'dsh-web-hub: provider tools')
}
