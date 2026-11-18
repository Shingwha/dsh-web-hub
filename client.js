window.__ModuleLoader__.load({
  id: 'dsh-web-hub',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const UI = require('@deepseek-ai/dsh-client-ui-primitives')

    const NS = 'dsh-web-hub'
    const BUNDLE = 'dsh-web-hub'

    /** Tool names are `<provider>_<tool>`; the suffix picks the localized label. */
    const TOOL_LABEL_KEYS = {
      search: 'tool_search',
      extract: 'tool_extract',
      get_sub_domains: 'tool_get_sub_domains',
      batch_search: 'tool_batch_search',
      score: 'tool_score',
    }

    const zh = {
      source: '来源',
      sourceHint: '同一时刻只有一个来源生效。',
      none: '还没有可用的来源。',
      use: '设为当前',
      using: '使用中',
      disable: '关闭',
      key: '密钥',
      keyHint: '可选。留空即匿名调用，限额较低。',
      keyPlaceholder: '粘贴 Key',
      keySave: '保存',
      keyClear: '清除',
      configured: '已配置',
      missing: '未配置',
      tools: '工具',
      toolsHint: '没勾选的工具不会出现在模型工具列表里。',
      toolsOff: '先选择一个来源，才能打开工具。',
      advanced: '扩展',
      reload: '重新读取',
      loadError: '读取配置失败',
      saveError: '保存失败',
      conflict: '配置已被其它改动更新，已重新读取。',
      saved: '已生效',
      applying: '应用中…',
    }

    const en = {
      source: 'Source',
      sourceHint: 'Exactly one source is active at a time.',
      none: 'No source available.',
      use: 'Use',
      using: 'In use',
      disable: 'Turn off',
      key: 'Key',
      keyHint: 'Optional. Empty means anonymous calls at a lower rate limit.',
      keyPlaceholder: 'Paste a key',
      keySave: 'Save',
      keyClear: 'Clear',
      configured: 'set',
      missing: 'not set',
      tools: 'Tools',
      toolsHint: 'Tools that are off never reach the model.',
      toolsOff: 'Pick a source before turning tools on.',
      advanced: 'extended',
      reload: 'Reload',
      loadError: 'Could not read the configuration',
      saveError: 'Could not save',
      conflict: 'Configuration changed elsewhere; reloaded.',
      saved: 'Applied',
      applying: 'Applying…',
    }

    const STYLES = [
      '.hub{display:flex;flex-direction:column;gap:14px;font-size:13px;color:var(--dsw-alias-text-l1)}',
      '.hub-card{border:1px solid var(--dsw-alias-border-l2);border-radius:10px}',
      '.hub-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}',
      '.hub-card-title{font-weight:600}',
      '.hub-card-body{display:flex;flex-direction:column}',
      '.hub-hint{color:var(--dsw-alias-text-l3);font-size:12px;line-height:1.45}',
      '.hub-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;min-height:20px}',
      '.hub-row+.hub-row{border-top:1px solid var(--dsw-alias-border-l2)}',
      '.hub-row-main{display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.hub-label{display:flex;align-items:center;gap:8px}',
      '.hub-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dsw-alias-text-l3)}',
      '.hub-side{display:flex;align-items:center;gap:8px;flex:none}',
      '.hub-foot{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.hub-error{font-size:12px;color:var(--dsw-alias-state-error-primary,#d33)}',
      '.hub-status{font-size:12px;color:var(--dsw-alias-text-l3)}',
    ].join('')

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

    function PanelInner(props) {
      const { remote, t } = props
      const [state, setState] = React.useState(undefined)
      const [keyDraft, setKeyDraft] = React.useState('')
      const [keyState, setKeyState] = React.useState(undefined)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(null)
      const queue = React.useRef(Promise.resolve())
      /** Latest namespace and revision, read when a queued write runs. */
      const position = React.useRef({ ns: undefined, revision: undefined })

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
            setState({ ns: ns.ns, value, revision: ns.revision })
            const provider = (value.providers || {})[value.active || ''] || {}
            const ref = typeof provider.keyRef === 'string' ? provider.keyRef : ''
            if (ref.length === 0) { setKeyState(undefined); return }
            const status = await remote.credentials.describe([ref])
            if (cancelled) return
            const map = status && status.ok ? status.value : undefined
            setKeyState(map && typeof map === 'object' ? map[ref] : undefined)
          })
          .catch((reason) => { if (!cancelled) setError(message(reason) || t('loadError')) })
        return () => { cancelled = true }
      }, [remote, t])

      React.useEffect(() => load(), [])

      // Switches apply immediately, like every other switch in the product.
      // Writes serialize and each reads the latest revision, so two quick
      // toggles cannot race.
      const apply = (patch, optimistic) => {
        setError(null)
        setState((current) => (current === undefined
          ? current
          : { ...current, value: { ...current.value, ...optimistic } }))
        queue.current = queue.current
          .then(async () => {
            const { ns, revision } = position.current
            if (ns === undefined) return
            const result = await remote.settings.update(ns, patch, revision)
            if (result && result.ok === false) {
              setError(result.error && result.error.code === 'settings/conflict' ? t('conflict') : (message(result.error) || t('saveError')))
              load()
              return
            }
            const next = result && result.ok ? result.value : undefined
            if (next !== undefined && next.revision !== undefined) {
              position.current = { ns, revision: next.revision }
              if (next.value !== undefined) setState({ ns, value: next.value, revision: next.revision })
            }
          })
          .catch((reason) => setError(message(reason) || t('saveError')))
      }

      if (state === undefined) {
        return h('div', { className: 'hub' },
          error === null
            ? h('span', { className: 'hub-hint' }, t('applying'))
            : h(React.Fragment, null,
              h('div', { className: 'hub-error' }, error),
              h('div', { className: 'hub-side' },
                h(UI.Button, { variant: 'outline', size: 'sm', onClick: load }, t('reload')))))
      }

      const value = state.value
      const providers = value.providers || {}
      const tools = value.tools || {}
      const active = typeof value.active === 'string' ? value.active : ''
      const provider = providers[active] || {}
      const keyRef = typeof provider.keyRef === 'string' ? provider.keyRef : ''
      const names = Object.keys(tools)
      const enabled = names.filter((name) => tools[name] === true).length
      const providerIds = Object.keys(providers)

      const toolLabel = (name) => {
        const key = TOOL_LABEL_KEYS[name.slice(name.indexOf('_') + 1)]
        return key === undefined ? name : t(key)
      }

      const saveKey = () => {
        if (busy || keyRef.length === 0 || keyDraft.trim().length === 0) return
        setBusy(true)
        setError(null)
        Promise.resolve()
          .then(() => remote.credentials.set(keyRef, keyDraft.trim()))
          .then(() => { setKeyDraft(''); return load() })
          .catch((reason) => setError(message(reason) || t('saveError')))
          .finally(() => setBusy(false))
      }

      const clearKey = () => {
        if (busy || keyRef.length === 0) return
        setBusy(true)
        setError(null)
        Promise.resolve()
          .then(() => remote.credentials.unset(keyRef))
          .then(() => load())
          .catch((reason) => setError(message(reason) || t('saveError')))
          .finally(() => setBusy(false))
      }

      return h('div', { className: 'hub' },
        h(Card, {
          title: t('source'),
          side: h('span', { className: 'hub-hint' }, t('sourceHint')),
        },
          providerIds.length === 0
            ? h('div', { className: 'hub-row' }, h('span', { className: 'hub-hint' }, t('none')))
            : providerIds.map((id) => (active === id
              ? h(React.Fragment, { key: id },
                h(Line, {
                  title: h('span', { className: 'hub-mono' }, id),
                  tag: h(UI.Tag, { tone: 'info' }, t('using')),
                },
                  h(UI.Button, {
                    variant: 'outline',
                    size: 'sm',
                    disabled: busy,
                    onClick: () => apply({ active: '' }, { active: '' }),
                  }, t('disable'))),
                h(Line, {
                  title: h('span', null, t('key')),
                  hint: h('span', { className: 'hub-hint' },
                    keyRef.length > 0 ? keyRef : t('keyHint'),
                    ' · ',
                    keyState !== undefined && keyState.configured === true ? t('configured') : t('missing')),
                },
                  h('div', { className: 'hub-side' },
                    h(UI.Input, {
                      type: 'password',
                      value: keyDraft,
                      placeholder: t('keyPlaceholder'),
                      disabled: busy || keyRef.length === 0,
                      onChange: (event) => setKeyDraft(event.target.value),
                    }),
                    h(UI.Button, {
                      variant: 'outline',
                      size: 'sm',
                      disabled: busy || keyDraft.trim().length === 0,
                      onClick: saveKey,
                    }, t('keySave')),
                    keyState !== undefined && keyState.configured === true
                      ? h(UI.Button, { variant: 'outline', size: 'sm', disabled: busy, onClick: clearKey }, t('keyClear'))
                      : null)))
              : h(Line, { key: id, title: h('span', { className: 'hub-mono' }, id) },
                h(UI.Button, {
                  variant: 'outline',
                  size: 'sm',
                  disabled: busy,
                  onClick: () => apply({ active: id }, { active: id }),
                }, t('use')))))),

        h(Card, {
          title: t('tools'),
          side: h('span', { className: 'hub-hint' }, names.length === 0 ? '' : `${enabled}/${names.length}`),
        },
          names.length === 0
            ? h('div', { className: 'hub-row' }, h('span', { className: 'hub-hint' }, t('none')))
            : names.map((name) => h(Line, {
              key: name,
              title: h('span', null, toolLabel(name)),
              tag: name.endsWith('_search') || name.endsWith('_extract') ? null : h(UI.Tag, { tone: 'neutral' }, t('advanced')),
              hint: h('span', { className: 'hub-mono' }, name),
            }, h(UI.Switch, {
              checked: tools[name] === true,
              label: toolLabel(name),
              disabled: busy || active === '',
              onChange: (next) => apply({ tools: { ...tools, [name]: next } }, { tools: { ...tools, [name]: next } }),
            })))),

        h('div', { className: 'hub-foot' },
          h('span', { className: 'hub-status' },
            error !== null ? h('span', { className: 'hub-error' }, error) : ''),
          h(UI.Button, { variant: 'outline', size: 'sm', onClick: load }, t('reload'))))
    }

    function Panel(props) {
      return h(React.Fragment, null,
        h('style', null, STYLES),
        h(PanelInner, props))
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
