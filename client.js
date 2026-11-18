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
      title: 'dsh-web-hub',
      summary: '选择用哪个搜索/抓取服务，并决定开放哪些工具。',
      source: '来源',
      sourceHint: '只有选中的来源会挂载工具。',
      none: '未启用任何来源',
      use: '设为当前',
      using: '使用中',
      disable: '关闭',
      tools: '工具',
      toolsHint: '没勾的工具不会出现在模型工具列表里。',
      key: 'API Key',
      keyHint: '可选。留空即匿名调用（限额较低），只存本机凭据库。',
      keyPlaceholder: '粘贴 Key 后保存',
      configured: '已配置',
      missing: '未配置（匿名）',
      clear: '清除',
      save: '保存',
      saving: '保存中…',
      saved: '已保存，工具列表即时更新。',
      reload: '重新读取',
      loadError: '读取配置失败。',
      saveError: '保存被拒绝，已保留你的修改。',
      conflict: '配置已被其他改动更新，请重新读取后再保存。',
      tool_search: '网页搜索',
      tool_extract: '抓取网页',
      tool_get_sub_domains: '垂直领域目录',
      tool_batch_search: '批量搜索',
      tool_score: '质量反馈',
    }

    const en = {
      title: 'dsh-web-hub',
      summary: 'Pick a search/fetch source and choose which of its tools the model gets.',
      source: 'Source',
      sourceHint: 'Only the selected source mounts tools.',
      none: 'No source enabled',
      use: 'Use',
      using: 'In use',
      disable: 'Off',
      tools: 'Tools',
      toolsHint: 'Tools that are off never reach the model.',
      key: 'API key',
      keyHint: 'Optional. Empty means anonymous calls at lower limits. Stored in the local credential store.',
      keyPlaceholder: 'Paste a key, then save',
      configured: 'configured',
      missing: 'not set (anonymous)',
      clear: 'Clear',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved; the tool list updates immediately.',
      reload: 'Reload',
      loadError: 'Could not read the configuration.',
      saveError: 'The deployment rejected these values; your edits were kept.',
      conflict: 'The configuration changed elsewhere; reload and save again.',
      tool_search: 'Web search',
      tool_extract: 'Fetch page',
      tool_get_sub_domains: 'Vertical domains',
      tool_batch_search: 'Batch search',
      tool_score: 'Quality feedback',
    }

    const STYLES = [
      '.hub{display:flex;flex-direction:column;gap:16px;font-size:13px;color:var(--dsw-alias-text-l1)}',
      '.hub-head{display:flex;flex-direction:column;gap:4px}',
      '.hub-title{font-size:14px;font-weight:600}',
      '.hub-sub{color:var(--dsw-alias-text-l3);line-height:1.5}',
      '.hub-card{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:12px}',
      '.hub-card-head{display:flex;flex-direction:column;gap:2px}',
      '.hub-card-title{font-weight:600}',
      '.hub-hint{color:var(--dsw-alias-text-l3);font-size:12px;line-height:1.45}',
      '.hub-row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:28px}',
      '.hub-row-main{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.hub-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dsw-alias-text-l3)}',
      '.hub-inline{display:flex;align-items:center;gap:8px;flex:none}',
      '.hub-actions{display:flex;align-items:center;gap:8px;padding-top:2px}',
      '.hub-status{font-size:12px;color:var(--dsw-alias-text-l3)}',
      '.hub-error{font-size:12px;color:var(--dsw-alias-state-error-primary,#d33)}',
    ].join('')

    function Row(props) {
      return h('div', { className: 'hub-row' },
        h('div', { className: 'hub-row-main' }, props.title, props.hint ? h('span', { className: 'hub-hint' }, props.hint) : null),
        props.children)
    }

    function Section(props) {
      return h('section', { className: 'hub-card' },
        h('div', { className: 'hub-card-head' },
          h('span', { className: 'hub-card-title' }, props.title),
          props.hint ? h('span', { className: 'hub-hint' }, props.hint) : null),
        props.children)
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
      const [view, setView] = React.useState(undefined)
      const [draft, setDraft] = React.useState(undefined)
      const [keyDraft, setKeyDraft] = React.useState('')
      const [keyState, setKeyState] = React.useState(undefined)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState(null)
      const [notice, setNotice] = React.useState(null)

      const keyRefOf = (value) => {
        const providers = (value && value.providers) || {}
        const active = (value && typeof value.active === 'string') ? value.active : ''
        const provider = providers[active] || {}
        return typeof provider.keyRef === 'string' ? provider.keyRef : ''
      }

      const load = React.useCallback(() => {
        let cancelled = false
        setError(null)
        setKeyDraft('')
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
            setView({ ns: ns.ns, value, revision: ns.revision })
            setDraft(JSON.parse(JSON.stringify(value)))
            const ref = keyRefOf(value)
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

      if (view === undefined) {
        return h('div', { className: 'hub' },
          error === null
            ? h('span', { className: 'hub-hint' }, t('saving'))
            : h(React.Fragment, null,
              h('div', { className: 'hub-error' }, error),
              h('div', { className: 'hub-actions' },
                h(UI.Button, { variant: 'outline', size: 'sm', onClick: load }, t('reload')))))
      }

      const value = draft === undefined ? view.value : draft
      const providers = value.providers || {}
      const tools = value.tools || {}
      const active = typeof value.active === 'string' ? value.active : ''
      const keyRef = keyRefOf(value)
      const providerIds = Object.keys(providers)
      const dirty = JSON.stringify(value) !== JSON.stringify(view.value)

      const patch = (part) => { setNotice(null); setDraft({ ...value, ...part }) }

      const save = () => {
        if (busy) return
        setBusy(true)
        setError(null)
        setNotice(null)
        const writeKey = keyDraft.trim().length > 0 && keyRef.length > 0
        Promise.resolve()
          .then(() => remote.settings.update(view.ns, { active, hideBuiltinWeb: value.hideBuiltinWeb !== false, tools }, view.revision))
          .then(async (result) => {
            if (result && result.ok === false) {
              setError(result.error && result.error.code === 'settings/conflict' ? t('conflict') : (message(result.error) || t('saveError')))
              return
            }
            if (writeKey) await remote.credentials.set(keyRef, keyDraft.trim())
            setNotice(t('saved'))
          })
          .catch((reason) => setError(message(reason) || t('saveError')))
          .finally(() => { setBusy(false); load() })
      }

      const clearKey = () => {
        if (busy || keyRef.length === 0) return
        setBusy(true)
        setError(null)
        setNotice(null)
        Promise.resolve()
          .then(() => remote.credentials.unset(keyRef))
          .then(() => setNotice(t('saved')))
          .catch((reason) => setError(message(reason) || t('saveError')))
          .finally(() => { setBusy(false); load() })
      }

      const toolLabel = (name) => {
        const suffix = name.slice(name.indexOf('_') + 1)
        const key = TOOL_LABEL_KEYS[suffix]
        return key === undefined ? name : t(key)
      }

      return h('div', { className: 'hub' },
        h('div', { className: 'hub-head' },
          h('span', { className: 'hub-title' }, t('title')),
          h('span', { className: 'hub-sub' }, t('summary'))),

        h(Section, { title: t('source'), hint: t('sourceHint') },
          providerIds.length === 0
            ? h('span', { className: 'hub-hint' }, t('none'))
            : providerIds.map((id) => h(Row, { key: id, title: h('span', { className: 'hub-mono' }, id) },
              active === id
                ? h('div', { className: 'hub-inline' },
                  h(UI.Tag, { tone: 'info' }, t('using')),
                  h(UI.Button, {
                    variant: 'outline',
                    size: 'sm',
                    disabled: busy,
                    onClick: () => patch({ active: '' }),
                  }, t('disable')))
                : h(UI.Button, {
                  variant: 'outline',
                  size: 'sm',
                  disabled: busy,
                  onClick: () => patch({ active: id }),
                }, t('use'))))),

        h(Section, { title: t('tools'), hint: t('toolsHint') },
          Object.keys(tools).length === 0
            ? h('span', { className: 'hub-hint' }, t('none'))
            : Object.keys(tools).map((name) => h(Row, {
              key: name,
              title: h('span', null, toolLabel(name)),
              hint: h('span', { className: 'hub-mono' }, name),
            }, h(UI.Switch, {
              checked: tools[name] === true,
              label: toolLabel(name),
              disabled: busy || active === '',
              onChange: (next) => patch({ tools: { ...tools, [name]: next } }),
            })))),

        h(Section, { title: t('key'), hint: t('keyHint') },
          h(Row, {
            title: h('span', { className: 'hub-mono' }, keyRef.length > 0 ? keyRef : '—'),
            hint: h('span', { className: 'hub-status' }, keyState === undefined
              ? ''
              : (keyState.configured === true ? t('configured') : t('missing'))),
          },
            h('div', { className: 'hub-inline' },
              h(UI.Input, {
                type: 'password',
                value: keyDraft,
                placeholder: t('keyPlaceholder'),
                disabled: busy || keyRef.length === 0,
                onChange: (event) => setKeyDraft(event.target.value),
              }),
              keyState !== undefined && keyState.configured === true
                ? h(UI.Button, { variant: 'outline', size: 'sm', disabled: busy, onClick: clearKey }, t('clear'))
                : null))),

        h('div', { className: 'hub-actions' },
          h(UI.Button, {
            variant: 'primary',
            disabled: busy || (!dirty && keyDraft.trim().length === 0),
            onClick: save,
          }, busy ? t('saving') : t('save')),
          h(UI.Button, { variant: 'outline', disabled: busy, onClick: load }, t('reload'))),

        error === null ? null : h('div', { className: 'hub-error' }, error),
        notice === null ? null : h('div', { className: 'hub-hint' }, notice))
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
