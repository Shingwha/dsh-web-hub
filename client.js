window.__ModuleLoader__.load({
  id: 'dsh-web-hub',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-web-hub'
    const BUNDLE = 'dsh-web-hub'

    const zh = {
      title: '网页来源',
      summary: '为模型提供哪些搜索与抓取工具。同一时刻只有一个来源生效。',
      active: '当前来源',
      activeHint: '只有被选中的来源会挂载工具；选择「关闭」即不下发任何工具。',
      hideBuiltin: '隐藏内置网页工具',
      hideBuiltinHint: '载入本插件期间，隐藏 DSH 内置的 web_search 与 web_fetch（会提示模型改用本页面的工具）。',
      toolsTitle: '工具开关',
      toolsHint: '逐工具控制是否下发；关闭的工具不会出现在模型工具列表里。',
      keyTitle: 'API Key',
      keyHint: '可选。多数来源允许匿名调用，只是限额更低；配置后仅写入本机凭据库，配置文件里只保存引用名。',
      keyConfigured: '已配置',
      keyMissing: '未配置（按匿名调用）',
      keyPlaceholder: '粘贴 Key 后保存',
      keyClear: '清除',
      save: '保存',
      saving: '保存中…',
      saved: '已保存，工具列表即时更新。',
      reload: '重新读取',
      loadError: '读取配置失败。',
      saveError: '保存被拒绝，已保留你的修改。',
      conflict: '配置已被其他改动更新，请重新读取后再保存。',
      none: '（关闭）',
      enable: '启用',
    }

    const en = {
      title: 'Web sources',
      summary: 'Which search and fetch tools the model gets. Exactly one source is active at a time.',
      active: 'Active source',
      activeHint: 'Only the selected source mounts tools. "Off" mounts none.',
      hideBuiltin: 'Hide built-in web tools',
      hideBuiltinHint: 'While this plugin is loaded, hide DSH\'s built-in web_search and web_fetch and point the model at these tools.',
      toolsTitle: 'Tools',
      toolsHint: 'Turn individual tools on or off. A tool that is off never reaches the model.',
      keyTitle: 'API key',
      keyHint: 'Optional. Most sources allow anonymous calls at lower limits. A saved key goes to the local credential store; the config keeps only the reference name.',
      keyConfigured: 'configured',
      keyMissing: 'not set (anonymous)',
      keyPlaceholder: 'Paste a key, then save',
      keyClear: 'Clear',
      save: 'Save',
      saving: 'Saving…',
      saved: 'Saved; the tool list updates immediately.',
      reload: 'Reload',
      loadError: 'Could not read the configuration.',
      saveError: 'The deployment rejected these values; your edits were kept.',
      conflict: 'The configuration changed elsewhere; reload and save again.',
      none: '(off)',
      enable: 'enabled',
    }

    const STYLES = [
      '.hub-root{display:flex;flex-direction:column;gap:14px;padding:4px 0;font-size:13px}',
      '.hub-head{display:flex;flex-direction:column;gap:4px}',
      '.hub-title{font-size:14px;font-weight:600;color:var(--dsw-alias-text-l1)}',
      '.hub-sub{color:var(--dsw-alias-text-l3);line-height:1.5}',
      '.hub-section{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:10px}',
      '.hub-section-title{font-weight:600;color:var(--dsw-alias-text-l1)}',
      '.hub-row{display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.hub-row-main{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.hub-label{color:var(--dsw-alias-text-l1)}',
      '.hub-hint{color:var(--dsw-alias-text-l3);font-size:12px;line-height:1.45}',
      '.hub-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:var(--dsw-alias-text-l2)}',
      '.hub-select,.hub-input{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-text-l1);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:5px 8px;font-size:13px}',
      '.hub-input{width:260px}',
      '.hub-switch{position:relative;width:40px;height:22px;border-radius:11px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);cursor:pointer;flex:none;transition:background .15s}',
      '.hub-switch[aria-checked="true"]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}',
      '.hub-switch:disabled{opacity:.5;cursor:default}',
      '.hub-knob{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s}',
      '.hub-switch[aria-checked="true"] .hub-knob{left:20px}',
      '.hub-actions{display:flex;align-items:center;gap:10px}',
      '.hub-btn{background:var(--dsw-alias-brand-primary);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:13px;cursor:pointer}',
      '.hub-btn:disabled{opacity:.5;cursor:default}',
      '.hub-btn-ghost{background:transparent;color:var(--dsw-alias-text-l2);border:1px solid var(--dsw-alias-border-l2)}',
      '.hub-ok{color:var(--dsw-alias-text-l3);font-size:12px}',
      '.hub-error{color:var(--dsw-alias-danger-primary,#d33);font-size:12px}',
    ].join('')

    function Switch(props) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': props.checked ? 'true' : 'false',
        'aria-label': props.label,
        disabled: props.disabled === true,
        className: 'hub-switch',
        onClick: () => { if (props.disabled !== true) props.onChange(!props.checked) },
      }, h('span', { className: 'hub-knob' }))
    }

    function Row(props) {
      return h('div', { className: 'hub-row' },
        h('div', { className: 'hub-row-main' },
          h('span', { className: 'hub-label' }, props.title),
          props.hint ? h('span', { className: 'hub-hint' }, props.hint) : null),
        props.children)
    }

    function findNamespace(view) {
      if (!view || !Array.isArray(view.namespaces)) return undefined
      return view.namespaces.find((ns) => typeof ns.ns === 'string' && ns.ns.indexOf('web-hub') !== -1)
    }

    function errorMessage(error) {
      if (error === undefined || error === null) return undefined
      if (typeof error === 'string') return error
      if (typeof error.message === 'string') return error.message
      try { return JSON.stringify(error) } catch { return String(error) }
    }

    function PanelInner(props) {
      const remote = props.remote
      const t = props.t
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
          .then(async (describe) => {
            if (cancelled) return
            if (describe && describe.ok === false) {
              setError(errorMessage(describe.error) || t('loadError'))
              return
            }
            const ns = findNamespace(describe && describe.ok ? describe.value : undefined)
            if (ns === undefined) {
              setError(t('loadError'))
              return
            }
            const value = ns.value && typeof ns.value === 'object' ? ns.value : {}
            setView({ ns: ns.ns, value, revision: ns.revision })
            setDraft(JSON.parse(JSON.stringify(value)))
            const ref = keyRefOf(value)
            if (ref.length === 0) { setKeyState(undefined); return }
            // `describe` takes a batch of reference names and answers a map keyed by them.
            const described = await remote.credentials.describe([ref])
            if (cancelled) return
            const map = described && described.ok ? described.value : undefined
            setKeyState(map && typeof map === 'object' ? map[ref] : undefined)
          })
          .catch((reason) => { if (!cancelled) setError(errorMessage(reason) || t('loadError')) })
        return () => { cancelled = true }
      }, [remote, t])

      React.useEffect(() => load(), [])

      if (view === undefined) {
        return h('div', { className: 'hub-root' },
          error === null
            ? h('span', { className: 'hub-hint' }, t('saving'))
            : h(React.Fragment, null,
              h('div', { className: 'hub-error' }, error),
              h('div', { className: 'hub-actions' },
                h('button', { type: 'button', className: 'hub-btn hub-btn-ghost', onClick: load }, t('reload')))))
      }

      const value = draft === undefined ? view.value : draft
      const providers = value.providers || {}
      const tools = value.tools || {}
      const active = typeof value.active === 'string' ? value.active : ''
      const dirty = JSON.stringify(value) !== JSON.stringify(view.value)
      const keyRef = keyRefOf(value)

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
              setError(result.error && result.error.code === 'settings/conflict' ? t('conflict') : (errorMessage(result.error) || t('saveError')))
              return
            }
            if (writeKey) await remote.credentials.set(keyRef, keyDraft.trim())
            setNotice(t('saved'))
          })
          .catch((reason) => setError(errorMessage(reason) || t('saveError')))
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
          .catch((reason) => setError(errorMessage(reason) || t('saveError')))
          .finally(() => { setBusy(false); load() })
      }

      return h('div', { className: 'hub-root' },
        h('div', { className: 'hub-head' },
          h('span', { className: 'hub-title' }, t('title')),
          h('span', { className: 'hub-sub' }, t('summary'))),

        h('div', { className: 'hub-section' },
          h(Row, { title: t('active'), hint: t('activeHint') },
            h('select', {
              className: 'hub-select',
              value: active,
              disabled: busy,
              onChange: (event) => patch({ active: event.target.value }),
            },
              h('option', { value: '' }, t('none')),
              Object.keys(providers).map((id) => h('option', { key: id, value: id }, id)))),
          h(Row, { title: t('hideBuiltin'), hint: t('hideBuiltinHint') },
            h(Switch, {
              checked: value.hideBuiltinWeb !== false,
              disabled: busy,
              label: t('hideBuiltin'),
              onChange: (next) => patch({ hideBuiltinWeb: next }),
            }))),

        h('div', { className: 'hub-section' },
          h('span', { className: 'hub-section-title' }, t('toolsTitle')),
          h('span', { className: 'hub-hint' }, t('toolsHint')),
          Object.keys(tools).length === 0
            ? h('span', { className: 'hub-hint' }, '—')
            : Object.keys(tools).map((name) => h(Row, { key: name, title: h('span', { className: 'hub-mono' }, name) },
              h(Switch, {
                checked: tools[name] === true,
                disabled: busy,
                label: name,
                onChange: (next) => {
                  const nextTools = { ...tools, [name]: next }
                  patch({ tools: nextTools })
                },
              })))),

        h('div', { className: 'hub-section' },
          h('span', { className: 'hub-section-title' }, t('keyTitle')),
          h('span', { className: 'hub-hint' }, t('keyHint')),
          h(Row, {
            title: h('span', { className: 'hub-mono' }, keyRef.length > 0 ? keyRef : '—'),
            hint: keyState === undefined ? undefined : (keyState.configured ? t('keyConfigured') : t('keyMissing')),
          },
            h('div', { className: 'hub-actions' },
              h('input', {
                className: 'hub-input',
                type: 'password',
                value: keyDraft,
                placeholder: t('keyPlaceholder'),
                disabled: busy || keyRef.length === 0,
                onChange: (event) => setKeyDraft(event.target.value),
              }),
              keyState !== undefined && keyState.configured === true
                ? h('button', { type: 'button', className: 'hub-btn hub-btn-ghost', disabled: busy, onClick: clearKey }, t('keyClear'))
                : null))),

        h('div', { className: 'hub-actions' },
          h('button', { type: 'button', className: 'hub-btn', disabled: busy || (!dirty && keyDraft.trim().length === 0), onClick: save },
            busy ? t('saving') : t('save')),
          h('button', { type: 'button', className: 'hub-btn hub-btn-ghost', disabled: busy, onClick: load }, t('reload'))),

        error === null ? null : h('div', { className: 'hub-error' }, error),
        notice === null ? null : h('div', { className: 'hub-ok' }, notice))
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
