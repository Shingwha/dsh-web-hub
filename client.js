window.__ModuleLoader__.load({
  id: 'dsh-web-hub',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const UI = require('@deepseek-ai/dsh-client-ui-primitives')

    const NS = 'dsh-web-hub'
    const BUNDLE = 'dsh-web-hub'

    const zh = {
      source: '来源',
      sourceHint: '同一时刻只有一个来源生效。',
      none: '还没有可用的来源。',
      use: '设为当前',
      using: '使用中',
      disable: '关闭',
      key: '密钥',
      keyHint: '可选，留空按匿名调用。',
      getKey: '获取 API Key',
      keyPlaceholder: '粘贴 Key（可留空）',
      keyPlaceholderConfigured: '已配置 · 粘贴新 Key 可替换',
      keySave: '保存',
      keyClear: '清除',
      configured: '已配置',
      missing: '未配置',
      tools: '工具',
      toolsHint: '没勾选的工具不会出现在模型工具列表里。',
      advanced: '扩展',
      builtin: '内置网页工具',
      builtinHide: '隐藏 web_search / web_fetch',
      reload: '重新读取',
      loadError: '读取配置失败',
      saveError: '保存失败',
      conflict: '配置已被其它改动更新，已重新读取。',
      loading: '读取中…',
    }

    const en = {
      source: 'Source',
      sourceHint: 'Exactly one source is active at a time.',
      none: 'No source available.',
      use: 'Use',
      using: 'In use',
      disable: 'Turn off',
      key: 'Key',
      keyHint: 'Optional; empty means anonymous calls.',
      getKey: 'Get an API key',
      keyPlaceholder: 'Paste a key (optional)',
      keyPlaceholderConfigured: 'Configured · paste a new key to replace',
      keySave: 'Save',
      keyClear: 'Clear',
      configured: 'set',
      missing: 'not set',
      tools: 'Tools',
      toolsHint: 'Tools that are off never reach the model.',
      advanced: 'extended',
      builtin: 'Built-in web tools',
      builtinHide: 'Hide web_search / web_fetch',
      reload: 'Reload',
      loadError: 'Could not read the configuration',
      saveError: 'Could not save',
      conflict: 'Configuration changed elsewhere; reloaded.',
      loading: 'Loading…',
    }

    const STYLES = [
      '.hub{display:flex;flex-direction:column;gap:14px;font-size:13px;color:var(--dsw-alias-text-l1)}',
      '.hub-card{border:1px solid var(--dsw-alias-border-l2);border-radius:10px}',
      '.hub-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}',
      '.hub-card-title{font-weight:600}',
      '.hub-card-body{display:flex;flex-direction:column}',
      '.hub-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px}',
      '.hub-row+.hub-row{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.hub-row-main{display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.hub-label{display:flex;align-items:center;gap:8px}',
      '.hub-hint{color:var(--dsw-alias-text-l3);font-size:12px;line-height:1.45}',
      '.hub-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dsw-alias-text-l3)}',
      '.hub-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px}',
      '.hub-link{margin-left:8px;color:var(--dsw-alias-brand-primary);text-decoration:none}',
      '.hub-link:hover{text-decoration:underline}',
      '.hub-side{display:flex;align-items:center;gap:8px;flex:none}',
      '.hub-foot{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.hub-error{font-size:12px;color:var(--dsw-alias-state-error-primary,#d33)}',
    ].join('')

    // ── building blocks ─────────────────────────────────────────────────────

    function Line(props) {
      return h('div', { className: 'hub-row' },
        h('div', { className: 'hub-row-main' },
          h('div', { className: 'hub-label' }, props.title, props.tag || null),
          props.hint ? h('span', { className: 'hub-hint' }, props.hint) : null),
        h('div', { className: 'hub-side' }, props.children))
    }

    function Card(props) {
      return h('section', { className: 'hub-card' },
        h('div', { className: 'hub-card-head' },
          h('span', { className: 'hub-card-title' }, props.title),
          props.side || null),
        h('div', { className: 'hub-card-body' }, props.children))
    }

    /** The provider whose settings the panel edits. */
    function providerOf(value) {
      const providers = (value && value.providers) || {}
      const active = value && typeof value.active === 'string' ? value.active : ''
      const provider = providers[active] || {}
      return {
        active,
        providers,
        keyRef: typeof provider.keyRef === 'string' ? provider.keyRef : '',
        consoleURL: typeof provider.consoleURL === 'string' ? provider.consoleURL : '',
      }
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

    // ── data ────────────────────────────────────────────────────────────────

    /**
     * Owns the settings namespace, the credential status, and the write queue.
     * Switches write immediately; writes serialize and each reads the latest
     * revision, so two quick toggles cannot race.
     */
    function useHub(remote, t) {
      const [state, setState] = React.useState(undefined)
      const [keyState, setKeyState] = React.useState(undefined)
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
            if (ns === undefined) {
              setError(t('loadError'))
              return
            }
            const value = ns.value && typeof ns.value === 'object' ? ns.value : {}
            position.current = { ns: ns.ns, revision: ns.revision }
            setState({ ns: ns.ns, value })
            const { keyRef } = providerOf(value)
            if (keyRef.length === 0) { setKeyState(undefined); return }
            const status = await remote.credentials.describe([keyRef])
            if (cancelled) return
            const map = status && status.ok ? status.value : undefined
            setKeyState(map && typeof map === 'object' ? map[keyRef] : undefined)
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
          if (next.value !== undefined) setState({ ns, value: next.value })
        }).catch((reason) => setError(message(reason) || t('saveError')))
      }

      const write = (patch, optimistic) => {
        setError(null)
        setState((current) => (current === undefined
          ? current
          : { ...current, value: { ...current.value, ...optimistic } }))
        send(patch)
      }

      const saveKey = (value) => {
        const { keyRef } = providerOf(state && state.value)
        if (busy || keyRef.length === 0 || value.trim().length === 0) return
        setBusy(true)
        setError(null)
        Promise.resolve()
          .then(() => remote.credentials.set(keyRef, value.trim()))
          .then(() => load())
          .catch((reason) => setError(message(reason) || t('saveError')))
          .finally(() => setBusy(false))
      }

      const clearKey = () => {
        const { keyRef } = providerOf(state && state.value)
        if (busy || keyRef.length === 0) return
        setBusy(true)
        setError(null)
        Promise.resolve()
          .then(() => remote.credentials.unset(keyRef))
          .then(() => load())
          .catch((reason) => setError(message(reason) || t('saveError')))
          .finally(() => setBusy(false))
      }

      return { state, keyState, busy, error, load, write, saveKey, clearKey }
    }

    // ── cards ───────────────────────────────────────────────────────────────

    function SourceCard(hub, t, keyDraft, setKeyDraft) {
      const { state, keyState, busy } = hub
      const { active, providers, keyRef, consoleURL } = providerOf(state.value)
      const ids = Object.keys(providers)
      const configured = keyState !== undefined && keyState.configured === true

      if (ids.length === 0) {
        return h(Card, { title: t('source') },
          h('div', { className: 'hub-row' }, h('span', { className: 'hub-hint' }, t('none'))))
      }

      const rows = []
      for (const id of ids) {
        if (id !== active) {
          rows.push(h(Line, { key: id, title: h('span', { className: 'hub-mono' }, id) },
            h(UI.Button, {
              variant: 'outline',
              size: 'sm',
              disabled: busy,
              onClick: () => hub.write({ active: id }, { active: id }),
            }, t('use'))))
          continue
        }

        rows.push(h(Line, {
          key: id,
          title: h('span', { className: 'hub-mono' }, id),
          tag: h(UI.Tag, { tone: 'info' }, t('using')),
        },
          h(UI.Button, {
            variant: 'outline',
            size: 'sm',
            disabled: busy,
            onClick: () => hub.write({ active: '' }, { active: '' }),
          }, t('disable'))))

        rows.push(h(Line, {
          key: id + ':key',
          title: h('span', { className: 'hub-label' },
            t('key'),
            h('span', { className: 'hub-mono' }, keyRef.length > 0 ? keyRef : t('keyHint')),
            consoleURL.length > 0
              ? h('a', {
                className: 'hub-link',
                href: consoleURL,
                target: '_blank',
                rel: 'noreferrer noopener',
              }, t('getKey'))
              : null),
          tag: configured
            ? h(UI.Tag, { tone: 'info' }, t('configured'))
            : h(UI.Tag, { tone: 'neutral' }, t('missing')),
        },
          h('div', { className: 'hub-side' },
            h(UI.Input, {
              type: 'password',
              value: keyDraft,
              placeholder: configured ? t('keyPlaceholderConfigured') : t('keyPlaceholder'),
              disabled: busy || keyRef.length === 0,
              onChange: (event) => setKeyDraft(event.target.value),
            }),
            h(UI.Button, {
              variant: 'outline',
              size: 'sm',
              disabled: busy || keyDraft.trim().length === 0,
              onClick: () => hub.saveKey(keyDraft),
            }, t('keySave')),
            configured
              ? h(UI.Button, { variant: 'outline', size: 'sm', disabled: busy, onClick: hub.clearKey }, t('keyClear'))
              : null)))
      }

      return h(Card, { title: t('source'), side: h('span', { className: 'hub-hint' }, t('sourceHint')) }, rows)
    }

    function ToolsCard(hub, t) {
      const { state, busy } = hub
      const value = state.value
      const tools = value.tools || {}
      const { active } = providerOf(value)
      const names = Object.keys(tools)
      const enabled = names.filter((name) => tools[name] === true).length

      const rows = names.map((name) => h(Line, {
        key: name,
        title: h('span', { className: 'hub-name' }, name),
        tag: name.endsWith('_search') || name.endsWith('_extract')
          ? null
          : h(UI.Tag, { tone: 'neutral' }, t('advanced')),
      }, h(UI.Switch, {
        checked: tools[name] === true,
        label: name,
        disabled: busy || active === '',
        onChange: (next) => hub.write(
          { tools: { ...tools, [name]: next } },
          { tools: { ...tools, [name]: next } },
        ),
      })))

      return h(Card, {
        title: t('tools'),
        side: h('span', { className: 'hub-hint' }, names.length === 0 ? '' : `${enabled}/${names.length}`),
      },
        names.length === 0
          ? h('div', { className: 'hub-row' }, h('span', { className: 'hub-hint' }, t('none')))
          : rows)
    }

    function BuiltinCard(hub, t) {
      const { state, busy } = hub
      const hidden = state.value.hideBuiltinWeb !== false
      return h(Card, { title: t('builtin') },
        h(Line, { title: h('span', null, t('builtinHide')) },
          h(UI.Switch, {
            checked: hidden,
            label: t('builtinHide'),
            disabled: busy,
            onChange: (next) => hub.write({ hideBuiltinWeb: next }, { hideBuiltinWeb: next }),
          })))
    }

    // ── panel ───────────────────────────────────────────────────────────────

    function PanelInner(props) {
      const { remote, t } = props
      const hub = useHub(remote, t)
      const [keyDraft, setKeyDraft] = React.useState('')

      if (hub.state === undefined) {
        return h('div', { className: 'hub' },
          hub.error === null
            ? h('span', { className: 'hub-hint' }, t('loading'))
            : h('div', { className: 'hub-side' },
              h('span', { className: 'hub-error' }, hub.error),
              h(UI.Button, { variant: 'outline', size: 'sm', onClick: hub.load }, t('reload'))))
      }

      return h('div', { className: 'hub' },
        SourceCard(hub, t, keyDraft, setKeyDraft),
        ToolsCard(hub, t),
        BuiltinCard(hub, t),
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
