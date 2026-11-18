window.__ModuleLoader__.load({
  id: 'dsh-web-hub',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const UI = require('@deepseek-ai/dsh-client-ui-primitives')

    const NS = 'dsh-web-hub'
    const BUNDLE = 'dsh-web-hub'
    const BUILTIN_PREFIX = 'web_'

    const zh = {
      tools: '工具',
      summary: '开关决定模型能看到哪些工具，来源只是分组。',
      builtin: '内置',
      builtinHint: '由官方插件提供，关闭后从模型工具列表移除。',
      keys: '密钥',
      getKey: '获取 API Key',
      keyPlaceholder: '粘贴 Key',
      keySave: '保存',
      keyClear: '清除',
      keySet: '已配置密钥',
      keyUnset: '未配置密钥',
      keyFree: '免 key',
      advanced: '扩展',
      reload: '重新读取',
      loadError: '读取配置失败',
      saveError: '保存失败',
      conflict: '配置已被其它改动更新，已重新读取。',
      loading: '读取中…',
    }

    const en = {
      tools: 'Tools',
      summary: 'The switches decide what the model sees; a provider is only a group.',
      builtin: 'Built-in',
      builtinHint: 'Shipped by the official plugins; turning one off removes it from the model.',
      keys: 'Key',
      getKey: 'Get an API key',
      keyPlaceholder: 'Paste a key',
      keySave: 'Save',
      keyClear: 'Clear',
      keySet: 'key set',
      keyUnset: 'no key',
      keyFree: 'keyless',
      advanced: 'extended',
      reload: 'Reload',
      loadError: 'Could not read the configuration',
      saveError: 'Could not save',
      conflict: 'Configuration changed elsewhere; reloaded.',
      loading: 'Loading…',
    }

    const STYLES = [
      '.hub{display:flex;flex-direction:column;gap:14px;font-size:13px;color:var(--dsw-alias-text-l1)}',
      '.hub-card{border:1px solid var(--dsw-alias-border-l2);border-radius:10px}',
      '.hub-card-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}',
      '.hub-card-title{font-weight:600}',
      '.hub-group{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.hub-group:first-child{border-top:none}',
      '.hub-group-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 16px;background:var(--dsw-alias-bg-layer-2)}',
      '.hub-group-name{font-weight:600}',
      '.hub-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px}',
      '.hub-row+.hub-row{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.hub-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}',
      '.hub-hint{color:var(--dsw-alias-text-l3);font-size:12px;line-height:1.45}',
      '.hub-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dsw-alias-text-l3)}',
      '.hub-side{display:flex;align-items:center;gap:8px;flex:none}',
      '.hub-link{color:var(--dsw-alias-brand-primary);text-decoration:none;white-space:nowrap}',
      '.hub-link:hover{text-decoration:underline}',
      '.hub-key{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px 12px;border-top:1px dashed var(--dsw-alias-border-l2)}',
      '.hub-key-main{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}',
      '.hub-foot{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.hub-error{font-size:12px;color:var(--dsw-alias-state-error-primary,#d33)}',
    ].join('')

    function row(name, hint, children) {
      return h('div', { className: 'hub-row', key: name },
        h('div', { className: 'hub-side', style: { flex: '1 1 auto', minWidth: 0 } },
          h('span', { className: 'hub-name' }, name),
          hint || null),
        h('div', { className: 'hub-side' }, children))
    }

    function findNamespace(view) {
      if (!view || !Array.isArray(view.namespaces)) return undefined
      return view.namespaces.find((ns) => typeof ns.ns === 'string' && ns.ns.indexOf('web-hub') !== -1)
    }

    function message(error) {
      if (error === undefined || error === null) return undefined
      if (typeof error === 'string') return error
      if (typeof error.message === 'string') return error.message
      try { return JSON.stringify(error) } catch { return String(error) }
    }

    /** Every keyRef in the config, deduplicated. */
    function keyRefs(providers) {
      const refs = new Set()
      for (const provider of Object.values(providers)) {
        if (provider && typeof provider.keyRef === 'string' && provider.keyRef.length > 0) refs.add(provider.keyRef)
      }
      return [...refs]
    }

    /** Group tool names: the built-ins first, then each provider in config order. */
    function groups(tools, providers) {
      const ids = Object.keys(providers)
      const builtin = []
      const byProvider = new Map(ids.map((id) => [id, []]))
      const stray = []

      for (const name of Object.keys(tools)) {
        if (name.startsWith(BUILTIN_PREFIX)) { builtin.push(name); continue }
        const owner = ids.find((id) => name.startsWith(`${id}_`))
        if (owner === undefined) stray.push(name)
        else byProvider.get(owner).push(name)
      }

      const out = [{ id: 'builtin', names: builtin }]
      for (const id of ids) {
        const names = byProvider.get(id)
        if (names.length > 0) out.push({ id, names })
      }
      if (stray.length > 0) out.push({ id: 'other', names: stray })
      return out.filter((group) => group.names.length > 0)
    }

    function useHub(remote, t) {
      const [state, setState] = React.useState(undefined)
      const [keys, setKeys] = React.useState({})
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(null)
      const position = React.useRef({ ns: undefined, revision: undefined })
      const queue = React.useRef(Promise.resolve())

      const load = React.useCallback(() => {
        let cancelled = false
        setError(null)
        Promise.resolve()
          .then(() => remote.settings.describe())
          .then(async (described) => {
            if (cancelled) return
            if (described && described.ok === false) {
              setError(message(described.error) || t('loadError'))
              return
            }
            const ns = findNamespace(described && described.ok ? described.value : undefined)
            if (ns === undefined) { setError(t('loadError')); return }
            const value = ns.value && typeof ns.value === 'object' ? ns.value : {}
            position.current = { ns: ns.ns, revision: ns.revision }
            setState({ value })

            const refs = keyRefs(value.providers || {})
            if (refs.length === 0) { setKeys({}); return }
            const status = await remote.credentials.describe(refs)
            if (cancelled) return
            const map = status && status.ok && status.value && typeof status.value === 'object' ? status.value : {}
            const next = {}
            for (const ref of refs) next[ref] = map[ref]?.configured === true
            setKeys(next)
          })
          .catch((reason) => { if (!cancelled) setError(message(reason) || t('loadError')) })
        return () => { cancelled = true }
      }, [remote, t])

      React.useEffect(() => load(), [])

      const send = (patch) => {
        queue.current = queue.current.then(async () => {
          const { ns, revision } = position.current
          if (ns === undefined) return
          const result = await remote.settings.update(ns, patch, revision)
          if (result && result.ok === false) {
            setError(result.error && result.error.code === 'settings/conflict'
              ? t('conflict')
              : (message(result.error) || t('saveError')))
            load()
            return
          }
          const next = result && result.ok ? result.value : undefined
          if (next === undefined || next.revision === undefined) return
          position.current = { ns, revision: next.revision }
          if (next.value !== undefined) setState({ value: next.value })
        }).catch((reason) => setError(message(reason) || t('saveError')))
      }

      const toggle = (tools, name, on) => {
        setError(null)
        const next = { ...tools, [name]: on }
        setState((current) => (current === undefined ? current : { value: { ...current.value, tools: next } }))
        send({ tools: next })
      }

      const writeKey = (ref, value, clear) => {
        if (busy) return
        setBusy(true)
        setError(null)
        const task = clear
          ? remote.credentials.unset(ref)
          : remote.credentials.set(ref, value)
        Promise.resolve()
          .then(() => task)
          .then(() => load())
          .catch((reason) => setError(message(reason) || t('saveError')))
          .finally(() => setBusy(false))
      }

      return { state, keys, busy, error, load, toggle, writeKey }
    }

    function KeyLine(props) {
      const { t, ref, configured, busy, onSave, onClear, consoleURL } = props
      const [draft, setDraft] = React.useState('')

      return h('div', { className: 'hub-key' },
        h('div', { className: 'hub-key-main' },
          h('span', { className: 'hub-hint' }, t('keys')),
          h('span', { className: 'hub-mono' }, ref),
          h('span', { className: 'hub-hint' }, configured ? t('keySet') : t('keyUnset')),
          consoleURL.length > 0
            ? h('a', { className: 'hub-link', href: consoleURL, target: '_blank', rel: 'noreferrer noopener' }, t('getKey'))
            : null),
        h('div', { className: 'hub-side' },
          h(UI.Input, {
            type: 'password',
            value: draft,
            placeholder: t('keyPlaceholder'),
            disabled: busy,
            onChange: (event) => setDraft(event.target.value),
          }),
          h(UI.Button, {
            variant: 'outline',
            size: 'sm',
            disabled: busy || draft.trim().length === 0,
            onClick: () => { onSave(draft.trim()); setDraft('') },
          }, t('keySave')),
          configured
            ? h(UI.Button, { variant: 'outline', size: 'sm', disabled: busy, onClick: onClear }, t('keyClear'))
            : null))
    }

    function Group(props) {
      const { t, group, tools, providers, keys, busy, onToggle, onKey } = props
      const provider = group.id === 'builtin' || group.id === 'other' ? undefined : providers[group.id]
      const title = group.id === 'builtin'
        ? t('builtin')
        : (provider && typeof provider.title === 'string' && provider.title.length > 0
          ? provider.title
          : group.id.charAt(0).toUpperCase() + group.id.slice(1))
      const keyRef = provider && typeof provider.keyRef === 'string' ? provider.keyRef : ''
      const configured = keys[keyRef] === true
      const consoleURL = provider && typeof provider.consoleURL === 'string' ? provider.consoleURL : ''

      const status = group.id === 'builtin'
        ? t('builtinHint')
        : keyRef.length === 0
          ? t('keyFree')
          : (configured ? t('keySet') : t('keyUnset'))

      return h('div', { className: 'hub-group' },
        h('div', { className: 'hub-group-head' },
          h('span', { className: 'hub-group-name' }, title),
          h('span', { className: 'hub-hint' }, status)),
        group.names.map((name) => row(name,
          name.indexOf('_') > 0 && /_(get_sub_domains|batch_search|score)$/.test(name)
            ? h(UI.Tag, { tone: 'neutral' }, t('advanced'))
            : null,
          h(UI.Switch, {
            checked: tools[name] === true,
            label: name,
            disabled: busy,
            onChange: (next) => onToggle(tools, name, next),
          }))),
        keyRef.length > 0
          ? h(KeyLine, {
            t,
            ref: keyRef,
            configured,
            busy,
            consoleURL,
            onSave: (value) => onKey(keyRef, value, false),
            onClear: () => onKey(keyRef, '', true),
          })
          : null)
    }

    function PanelInner(props) {
      const { remote, t } = props
      const hub = useHub(remote, t)

      if (hub.state === undefined) {
        return h('div', { className: 'hub' },
          hub.error === null
            ? h('span', { className: 'hub-hint' }, t('loading'))
            : h('div', { className: 'hub-side' },
              h('span', { className: 'hub-error' }, hub.error),
              h(UI.Button, { variant: 'outline', size: 'sm', onClick: hub.load }, t('reload'))))
      }

      const value = hub.state.value
      const tools = value.tools || {}
      const providers = value.providers || {}
      const names = Object.keys(tools)
      const on = names.filter((name) => tools[name] === true).length

      return h('div', { className: 'hub' },
        h('section', { className: 'hub-card' },
          h('div', { className: 'hub-card-head' },
            h('div', null,
              h('div', { className: 'hub-card-title' }, t('tools')),
              h('div', { className: 'hub-hint' }, t('summary'))),
            h('span', { className: 'hub-hint' }, `${on}/${names.length}`)),
          names.length === 0
            ? h('div', { className: 'hub-row' }, h('span', { className: 'hub-hint' }, t('loading')))
            : groups(tools, providers).map((group) => h(Group, {
              key: group.id,
              t,
              group,
              tools,
              providers,
              keys: hub.keys,
              busy: hub.busy,
              onToggle: hub.toggle,
              onKey: hub.writeKey,
            }))),
        h('div', { className: 'hub-foot' },
          h('span', { className: 'hub-error' }, hub.error === null ? '' : hub.error),
          h(UI.Button, { variant: 'outline', size: 'sm', onClick: hub.load }, t('reload'))))
    }

    function Panel(props) {
      return h(React.Fragment, null, h('style', null, STYLES), h(PanelInner, props))
    }

    return {
      inject: ['slots', 'locale', 'remote', 'remote.settings', 'remote.credentials'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-web-hub: dictionaries')
        const t = ctx.locale.bind(NS)
        const face = () => ({ remote: ctx.remote, t })
        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: BUNDLE,
          locale: NS,
          inject: face,
        }, Panel))
      },
    }
  },
})
