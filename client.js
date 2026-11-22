window.__ModuleLoader__.load({
  id: 'dsh-web-hub',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const UI = require('@deepseek-ai/dsh-client-ui-primitives')
    const NS = 'dsh-web-hub'
    const BUNDLE = 'dsh-web-hub'
    // The Loader entry id is also the settings namespace of this row.
    const SETTINGS = 'web-hub'
    const BUILTIN_PREFIX = 'web_'

    const zh = {
      tools: '工具',
      summary: '开关决定模型能看到哪些工具，来源只是分组。',
      builtin: '内置',
      other: '其他',
      emptyTools: '配置里没有工具开关。',
      keys: 'API Key',
      getKey: '获取 API Key',
      keyRefHint: '凭据引用：{ref}',
      keySave: '保存',
      keyClear: '清除',
      keySet: '已配置',
      keyUnset: '未配置',
      keyFree: '免 key',
      keySetUp: '设置',
      keyChange: '更换',
      keyCancel: '取消',
      reload: '重新读取',
      loadError: '读取配置失败。',
      saveError: '保存失败。',
      conflict: '配置已被其他窗口修改，已重新读取。',
      loading: '读取中…',
      renderError: '面板渲染出错：',
    }

    const en = {
      tools: 'Tools',
      summary: 'The switches decide what the model sees; a provider is only a group.',
      builtin: 'Built-in',
      other: 'Other',
      emptyTools: 'This configuration has no tool switches.',
      keys: 'API key',
      getKey: 'Get an API key',
      keyRefHint: 'Credential reference: {ref}',
      keySave: 'Save',
      keyClear: 'Clear',
      keySet: 'set',
      keyUnset: 'not set',
      keyFree: 'keyless',
      keySetUp: 'set up',
      keyChange: 'change',
      keyCancel: 'cancel',
      reload: 'Reload',
      loadError: 'Could not read the configuration.',
      saveError: 'Could not save.',
      conflict: 'Configuration changed elsewhere; reloaded.',
      loading: 'Loading…',
      renderError: 'The panel failed to render: ',
    }

    const STYLES = [
      '.wh{display:flex;flex-direction:column;gap:24px;color:var(--dsw-alias-label-primary)}',
      '.wh-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}',
      '.wh-title{margin:0;font-size:14px;font-weight:500;line-height:20px}',
      '.wh-summary{margin:4px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-count{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}',
      '.wh-group{display:flex;flex-direction:column}',
      '.wh-group-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}',
      '.wh-group-name{font-size:14px;font-weight:500;line-height:20px}',
      '.wh-group-tags{display:flex;align-items:center;gap:8px}',
      '.wh-chip{font-size:11px;line-height:1.5;color:var(--dsw-alias-state-warning-primary,#b4690e);white-space:nowrap}',
      '.wh-chip-quiet{color:var(--dsw-alias-label-tertiary)}',
      '.wh-panel{padding:0 16px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform)}',
      '.wh-panel>*+*{border-top:0.5px solid var(--dsw-alias-border-l2)}',
      '.wh-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0}',
      '.wh-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.5}',
      '.wh-hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-keyrow{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0}',
      '.wh-keyrow-main{display:flex;align-items:center;gap:8px;min-width:0}',
      '.wh-keyrow-label{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}',
      '.wh-keyrow-state{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-keyrow-ref{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.wh-action{appearance:none;background:none;border:0;padding:0;font:inherit;font-size:12px;line-height:1.5;color:var(--dsw-alias-link);cursor:pointer}',
      '.wh-action:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}',
      '.wh-action-strong{color:var(--dsw-alias-label-primary);font-weight:500}',
      '.wh-key-actions{display:flex;align-items:center;gap:12px;padding:0 0 12px;flex-wrap:wrap}',
      '.wh-link{color:var(--dsw-alias-link);text-decoration:none;font-size:12px;line-height:1.5}',
      '.wh-foot{display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.wh-error{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-state-error-primary)}',
      '@media (hover:hover){.wh-link:hover{text-decoration:underline}}',
      '@media (hover:hover){.wh-action:not(:disabled):hover{text-decoration:underline}}',
    ].join('')

    // ── Small shared helpers ────────────────────────────────────────────────

    /** Minimal external store: the slot runtime reads it through getSnapshot/subscribe. */
    function createStore(initial) {
      let snapshot = initial
      const listeners = new Set()
      return {
        getSnapshot: () => snapshot,
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        set(next) {
          snapshot = next
          for (const listener of listeners) listener()
        },
      }
    }

    function message(error) {
      if (error === undefined || error === null) return undefined
      if (typeof error === 'string') return error
      if (typeof error.message === 'string') return error.message
      try { return JSON.stringify(error) } catch { return String(error) }
    }

    /** A tool's effective switch: built-ins are on unless explicitly off, provider tools off unless on. */
    function enabled(name, tools) {
      return name.startsWith(BUILTIN_PREFIX) ? tools[name] !== false : tools[name] === true
    }

    /** Every credential reference in the config, deduplicated and trimmed. */
    function keyRefs(providers) {
      const refs = new Set()
      for (const provider of Object.values(providers)) {
        const ref = typeof provider?.keyRef === 'string' ? provider.keyRef.trim() : ''
        if (ref !== '') refs.add(ref)
      }
      return [...refs]
    }

    /** Built-ins first, then each provider in config order, then unclaimed tools. */
    function groups(tools, providers) {
      const ids = Object.keys(providers)
      const builtin = []
      const byProvider = new Map(ids.map(id => [id, []]))
      const other = []
      for (const name of Object.keys(tools)) {
        if (name.startsWith(BUILTIN_PREFIX)) { builtin.push(name); continue }
        const owner = ids.find(id => name.startsWith(`${id}_`))
        if (owner === undefined) other.push(name)
        else byProvider.get(owner).push(name)
      }
      const out = []
      if (builtin.length > 0) out.push({ id: 'builtin', names: builtin })
      for (const id of ids) {
        const names = byProvider.get(id)
        if (names.length > 0) out.push({ id, names })
      }
      if (other.length > 0) out.push({ id: 'other', names: other })
      return out
    }

    // ── Controller ──────────────────────────────────────────────────────────

    /**
     * Owns the settings snapshot, the writes, and the credential status. The
     * React tree below only renders this snapshot and calls these actions.
     */
    class HubController {
      constructor(ctx, t) {
        this.ctx = ctx
        this.t = t
        this.disposed = false
        this.loadSequence = 0
        this.state = { status: 'loading', error: null, value: undefined, revision: undefined, keys: {}, busy: false }
        this.store = createStore(this.state)
        void this.load()
      }

      set(patch) {
        this.state = { ...this.state, ...patch }
        this.store.set(this.state)
      }

      async load() {
        if (this.disposed) return
        const sequence = ++this.loadSequence
        this.set(this.state.value === undefined ? { status: 'loading', error: null } : { error: null })
        try {
          const described = await this.ctx.remote.settings.describe()
          if (this.disposed || sequence !== this.loadSequence) return
          if (!described.ok) {
            this.set({ status: this.state.value === undefined ? 'error' : 'ready', error: message(described.error) || this.t('loadError') })
            return
          }
          const namespaces = Array.isArray(described.value?.namespaces) ? described.value.namespaces : []
          const view = namespaces.find(candidate => candidate.ns === SETTINGS)
          if (view === undefined) {
            this.set({ status: this.state.value === undefined ? 'error' : 'ready', error: this.t('loadError') })
            return
          }
          const value = view.value && typeof view.value === 'object' ? view.value : {}
          const refs = keyRefs(value.providers || {})
          const keys = refs.length === 0 ? {} : await this.readKeys(refs)
          if (this.disposed || sequence !== this.loadSequence) return
          this.set({
            status: 'ready',
            error: null,
            value,
            revision: view.revision,
            keys: keys === undefined ? this.state.keys : keys,
          })
        } catch (reason) {
          if (this.disposed || sequence !== this.loadSequence) return
          this.set({ status: this.state.value === undefined ? 'error' : 'ready', error: message(reason) || this.t('loadError') })
        }
      }

      async toggle(name, on) {
        const current = this.state
        if (current.status !== 'ready' || current.busy) return
        const tools = { ...(current.value.tools || {}), [name]: on }
        this.set({ busy: true, error: null, value: { ...current.value, tools } })
        try {
          const result = await this.ctx.remote.settings.mutate(
            SETTINGS,
            [{ op: 'set', path: ['tools', name], value: on }],
            current.revision,
          )
          if (this.disposed) return
          if (!result.ok) { await this.fail(result.error); return }
          const view = result.value
          this.set({
            busy: false,
            revision: view?.revision ?? current.revision,
            value: view?.value ?? { ...current.value, tools },
          })
        } catch (reason) {
          if (!this.disposed) await this.fail(reason)
        }
      }

      async saveKey(ref, value) {
        return await this.writeKey(ref, value, false)
      }

      async clearKey(ref) {
        return await this.writeKey(ref, '', true)
      }

      async writeKey(ref, value, clear) {
        if (this.state.busy) return false
        this.set({ busy: true, error: null })
        try {
          const result = clear
            ? await this.ctx.remote.credentials.unset(ref)
            : await this.ctx.remote.credentials.set(ref, value)
          if (result && result.ok === false) {
            this.set({ busy: false, error: message(result.error) || this.t('saveError') })
            return false
          }
          if (this.disposed) return false
          this.set({ busy: false, keys: { ...this.state.keys, [ref]: !clear } })
          return true
        } catch (reason) {
          if (!this.disposed) this.set({ busy: false, error: message(reason) || this.t('saveError') })
          return false
        }
      }

      async readKeys(refs) {
        if (this.disposed) return undefined
        try {
          const status = await this.ctx.remote.credentials.describe(refs)
          if (this.disposed || !status.ok) return undefined
          const keys = {}
          for (const ref of refs) keys[ref] = status.value?.[ref]?.configured === true
          return keys
        } catch {
          return undefined
        }
      }

      async fail(error) {
        const conflict = error?.code === 'settings/conflict'
        await this.load()
        if (this.disposed) return
        this.set({ busy: false, error: conflict ? this.t('conflict') : (message(error) || this.t('saveError')) })
      }

      dispose() {
        this.disposed = true
      }
    }

    // ── React tree ──────────────────────────────────────────────────────────

    class Boundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      render() {
        if (this.state.error === null) return this.props.children
        return h('p', { className: 'wh-error' },
          this.props.t('renderError') + String(this.state.error?.message ?? this.state.error))
      }
    }

    /**
     * One provider's credential. Collapsed it is a single summary line under
     * the switches; the edit state exists only while the user is typing. The
     * group header carries the same state, where it can be scanned across
     * providers without reading each row.
     */
    function KeyBlock(props) {
      const { t, keyRef, configured, consoleURL, busy, onSave, onClear } = props
      const id = React.useId()
      const [editing, setEditing] = React.useState(false)
      const [draft, setDraft] = React.useState('')
      const close = () => {
        setEditing(false)
        setDraft('')
      }

      if (editing) {
        return h('div', { className: 'wh-key' },
          h(UI.SettingsSecretField, {
            id,
            label: t('keys'),
            hint: t('keyRefHint', { ref: keyRef }),
            text: draft,
            configured,
            stateLabel: configured ? t('keySet') : t('keyUnset'),
            disabled: busy,
            onEdit: setDraft,
          }),
          h('div', { className: 'wh-key-actions' },
            h('button', {
              type: 'button',
              className: 'wh-action wh-action-strong',
              disabled: busy || draft.trim().length === 0,
              onClick: async () => {
                if (await onSave(keyRef, draft.trim())) close()
              },
            }, t('keySave')),
            h('button', {
              type: 'button',
              className: 'wh-action',
              disabled: busy,
              onClick: close,
            }, t('keyCancel')),
            consoleURL.length > 0
              ? h('a', { className: 'wh-link', href: consoleURL, target: '_blank', rel: 'noreferrer noopener' }, t('getKey'))
              : null))
      }

      return h('div', { className: 'wh-keyrow' },
        h('span', { className: 'wh-keyrow-main' },
          h('span', { className: 'wh-keyrow-label' }, t('keys')),
          configured ? h('span', { className: 'wh-keyrow-state' }, t('keySet')) : null,
          h('button', {
            type: 'button',
            className: 'wh-action',
            disabled: busy,
            onClick: () => setEditing(true),
          }, configured ? t('keyChange') : t('keySetUp')),
          configured
            ? h('button', {
              type: 'button',
              className: 'wh-action',
              disabled: busy,
              onClick: () => { void onClear(keyRef) },
            }, t('keyClear'))
            : null),
        h('span', { className: 'wh-keyrow-ref' }, keyRef))
    }

    function ToolRow(props) {
      const { name, checked, busy, onToggle } = props
      return h('div', { className: 'wh-row' },
        h('span', { className: 'wh-name' }, name),
        h(UI.Switch, {
          checked,
          label: name,
          disabled: busy,
          onChange: next => onToggle(name, next),
        }))
    }

    function ProviderSection(props) {
      const { t, group, tools, providers, keys, busy, onToggle, onSaveKey, onClearKey } = props
      const provider = group.id === 'builtin' || group.id === 'other' ? undefined : providers[group.id]
      const keyRef = typeof provider?.keyRef === 'string' ? provider.keyRef.trim() : ''
      const consoleURL = typeof provider?.consoleURL === 'string' ? provider.consoleURL.trim() : ''
      const configured = keyRef.length > 0 && keys[keyRef] === true
      const title = group.id === 'builtin'
        ? t('builtin')
        : group.id === 'other'
          ? t('other')
          : (typeof provider?.title === 'string' && provider.title.trim().length > 0 ? provider.title.trim() : group.id)
      return h('section', { className: 'wh-group' },
        h('div', { className: 'wh-group-head' },
          h('span', { className: 'wh-group-name' }, title),
          h('span', { className: 'wh-group-tags' },
            // Only the abnormal state has to interrupt a scan.
            provider !== undefined && keyRef.length > 0 && !configured
              ? h('span', { className: 'wh-chip' }, t('keyUnset'))
              : null,
            provider !== undefined && keyRef.length === 0
              ? h('span', { className: 'wh-chip wh-chip-quiet' }, t('keyFree'))
              : null)),
        h('div', { className: 'wh-panel' },
          group.names.map(name => h(ToolRow, {
            key: name,
            name,
            checked: enabled(name, tools),
            busy,
            onToggle,
          })),
          keyRef.length > 0
            ? h(KeyBlock, {
              key: keyRef,
              t,
              keyRef,
              configured,
              consoleURL,
              busy,
              onSave: onSaveKey,
              onClear: onClearKey,
            })
            : null))
    }

    function PanelInner(props) {
      const { t } = props
      const state = props.useWebHub(snapshot => snapshot)
      if (state.status === 'loading') {
        return h('div', { className: 'wh' }, h('p', { className: 'wh-hint' }, t('loading')))
      }
      if (state.status === 'error') {
        return h('div', { className: 'wh' },
          h('p', { className: 'wh-error' }, state.error || t('loadError')),
          h(UI.Button, { variant: 'outline', size: 'sm', onClick: props.reload }, t('reload')))
      }
      const value = state.value ?? {}
      const tools = value.tools ?? {}
      const providers = value.providers ?? {}
      const names = Object.keys(tools)
      const on = names.filter(name => enabled(name, tools)).length
      return h('div', { className: 'wh' },
        h('header', { className: 'wh-head' },
          h('div', null,
            h('h4', { className: 'wh-title' }, t('tools')),
            h('p', { className: 'wh-summary' }, t('summary'))),
          h('span', { className: 'wh-count' }, `${on}/${names.length}`)),
        names.length === 0
          ? h('p', { className: 'wh-hint' }, t('emptyTools'))
          : groups(tools, providers).map(group => h(ProviderSection, {
            key: group.id,
            t,
            group,
            tools,
            providers,
            keys: state.keys,
            busy: state.busy,
            onToggle: props.toggle,
            onSaveKey: props.saveKey,
            onClearKey: props.clearKey,
          })),
        h('div', { className: 'wh-foot' },
          h('span', { className: 'wh-error' }, state.error ?? ''),
          h(UI.Button, { variant: 'outline', size: 'sm', disabled: state.busy, onClick: props.reload }, t('reload'))))
    }

    function Panel(props) {
      return h(React.Fragment, null,
        h('style', null, STYLES),
        h(Boundary, { t: props.t }, h(PanelInner, props)))
    }

    return {
      inject: ['slots', 'locale', 'remote', 'remote.settings', 'remote.credentials'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-web-hub: dictionaries')
        const t = ctx.locale.bind(NS)
        const controller = new HubController(ctx, t)
        ctx.effect(() => () => controller.dispose(), 'dsh-web-hub: controller')
        ctx.effect(
          () => ctx.on('connection/reset', () => { void controller.load() }),
          'dsh-web-hub: reconnect refresh',
        )
        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: BUNDLE,
          locale: NS,
          inject: () => ({
            hooks: { webHub: controller.store },
            toggle: (name, on) => controller.toggle(name, on),
            saveKey: (ref, value) => controller.saveKey(ref, value),
            clearKey: ref => controller.clearKey(ref),
            reload: () => { void controller.load() },
          }),
        }, Panel))
      },
    }
  },
})
