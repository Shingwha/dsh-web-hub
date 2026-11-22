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
      needKey: '需 API Key',
      enabledCount: '已启用的工具数',
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
      cardSearch: '搜索',
      cardExtract: '抓取',
      cardCount: '{count} 个网页',
      cardNoResults: '没有找到结果',
      cardSourcesTruncated: '仅显示前几个来源',
      cardContentTruncated: '内容已截断',
      cardRunning: '进行中',
      cardFailed: '失败',
      cardExpand: '展开',
      cardCollapse: '收起',
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
      needKey: 'needs API key',
      enabledCount: 'enabled tools',
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
      cardSearch: 'Search',
      cardExtract: 'Fetch',
      cardCount: '{count} pages',
      cardNoResults: 'No results found',
      cardSourcesTruncated: 'Only the first sources are shown',
      cardContentTruncated: 'content truncated',
      cardRunning: 'running',
      cardFailed: 'failed',
      cardExpand: 'Expand',
      cardCollapse: 'Collapse',
    }

    const STYLES = [
      '.wh{display:flex;flex-direction:column;gap:24px;color:var(--dsw-alias-label-primary)}',
      '.wh-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px}',
      '.wh-title{margin:0;font-size:14px;font-weight:500;line-height:20px}',
      '.wh-summary{margin:4px 0 0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-count{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}',
      '.wh-group{display:flex;flex-direction:column}',
      '.wh-group-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}',
      '.wh-group-title{display:inline-flex;align-items:center;gap:8px;min-width:0}',
      '.wh-group-name{font-size:14px;font-weight:500;line-height:20px}',
      '.wh-group-tags{display:flex;align-items:center;gap:8px}',
      '.wh-group-count{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}',
      '.wh-chip{font-size:11px;line-height:1.5;color:var(--dsw-alias-state-warning-primary,#b4690e);white-space:nowrap}',
      '.wh-chip-quiet{color:var(--dsw-alias-label-tertiary)}',
      '.wh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;padding:12px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform)}',
      '.wh-tool{display:flex;flex-direction:column;gap:4px;min-width:0;padding:8px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,var(--dsw-alias-bg-module-platform));cursor:pointer}',
      '.wh-tool[data-on=true]{border-color:color-mix(in srgb,var(--dsw-alias-link) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-link) 12%,var(--dsw-alias-bg-module-platform))}',
      '.wh-tool[data-busy=true]{cursor:default;opacity:0.6}',
      '.wh-tool-main{display:flex;align-items:center;gap:10px;min-width:0}',
      '.wh-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.5}',
      '.wh-tool-switch{display:inline-flex;flex:none}',
      '.wh-note{font-size:10.5px;font-weight:500;line-height:1.6;padding:0 5px;border-radius:4px;background:rgba(180,105,14,0.14);color:var(--dsw-alias-state-warning-primary,#b4690e);white-space:nowrap}',
      '.wh-hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-keyrow{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0 0;border-top:0.5px solid var(--dsw-alias-border-l2)}',
      '.wh-keyrow-main{display:flex;align-items:center;gap:8px;min-width:0}',
      '.wh-keyrow-label{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary))}',
      '.wh-keyrow-state{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-keyrow-ref{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.wh-action{appearance:none;background:none;border:0;padding:0;font:inherit;font-size:12px;line-height:1.5;color:var(--dsw-alias-link);cursor:pointer}',
      '.wh-action:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}',
      '.wh-action-strong{color:var(--dsw-alias-label-primary);font-weight:500}',
      '.wh-key{grid-column:1/-1;padding:12px 0 0;border-top:0.5px solid var(--dsw-alias-border-l2)}',
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

    // ── Tool cards ──────────────────────────────────────────────────────────
    //
    // A search or fetch call is one compact row: what ran, what it found, and
    // nothing else until the reader opens it. The card draws its own icon and
    // chevron rather than borrowing a Harness client primitive, so the shape
    // here is ours and a DSH upgrade cannot change it. Data comes from the
    // result's persisted `meta`; anything unreadable falls back to the text.

    /**
     * Live settings for the cards, wired to the hub controller when the plugin
     * starts. A card needs one field from it: the configured title of the
     * provider that owns the tool.
     */
    let readSettings = () => ({})

    /** Display name of the provider owning a wire tool name. */
    function providerTitle(toolName) {
      const id = providerId(toolName)
      const providers = readSettings().providers
      const title = providers !== null && providers !== undefined ? providers[id]?.title : undefined
      if (typeof title === 'string' && title.trim().length > 0) return title.trim()
      return id.charAt(0).toUpperCase() + id.slice(1)
    }

    // <generated:catalog>
    /** Generated from src/providers by scripts/sync-client-catalog.mjs; do not edit. */
    const CARD_KINDS = {
      anysearch_batch_search: 'search',
      anysearch_search: 'search',
      exa_search: 'search',
      firecrawl_search: 'search',
      tavily_crawl: 'search',
      tavily_map: 'search',
      tavily_search: 'search',
      anysearch_extract: 'fetch',
      exa_extract: 'fetch',
      firecrawl_extract: 'fetch',
      tavily_extract: 'fetch',
    }

    /** Tools that only answer with a provider key; the panel says so while it is unset. */
    const KEY_ONLY = new Set(['tavily_crawl', 'tavily_map', 'tavily_research'])

    /** Home host of each provider, whose mark a row falls back to. */
    const PROVIDER_HOSTS = {
      anysearch: 'anysearch.com',
      exa: 'exa.ai',
      firecrawl: 'firecrawl.dev',
      tavily: 'tavily.com',
    }
    // </generated:catalog>

    /** Card rules live with the card: the chat never mounts the plugin panel. */
    const CARD_STYLES = [
      '.wh-card{display:flex;flex-direction:column;gap:2px;color:var(--dsw-alias-label-tertiary)}',
      '.wh-card-row{display:flex;align-items:center;gap:8px;min-height:24px;padding:2px 0;border-radius:4px}',
      '.wh-card-row[data-expandable=true]{cursor:pointer}',
      '.wh-card-row[data-expandable=true]:hover{color:var(--dsw-alias-label-secondary)}',
      '.wh-card-failed{color:var(--dsw-alias-state-error-primary)}',
      '.wh-card-icon{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:currentColor}',
      '.wh-provider{display:inline-flex;flex:none;align-items:center;justify-content:center;overflow:hidden}',
      '.wh-provider-img{display:block;width:100%;height:100%;object-fit:contain}',
      '.wh-card-label{flex:none;font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
      '.wh-card-provider{color:var(--dsw-alias-label-tertiary)}',
      '.wh-card-summary{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;line-height:1.5}',
      '.wh-card-link{color:var(--dsw-alias-link);text-decoration:none}',
      '.wh-card-link:hover{text-decoration:underline}',
      '.wh-card-marks{display:inline-flex;align-items:center;gap:4px;flex:none}',
      '.wh-card-more{font-size:10px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-card-meta{flex:none;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}',
      '.wh-card-failed .wh-card-meta{color:inherit}',
      '.wh-card-chevron{flex:none;margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin:0;padding:0;border:0;background:none;color:inherit;cursor:pointer;transition:transform .12s ease}',
      '.wh-card-chevron[aria-expanded=true]{transform:rotate(180deg)}',
      '.wh-card-body{display:flex;flex-direction:column;gap:10px;padding:4px 0 10px}',
      '.wh-card-empty{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-card-text{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary)}',
      '.wh-item{display:flex;gap:8px;min-width:0}',
      '.wh-item-index{flex:none;width:14px;text-align:right;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}',
      '.wh-item-mark{display:inline-flex;flex:none;margin-top:1px}',
      '.wh-item-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}',
      '.wh-site{position:relative;display:inline-flex;flex:none;align-items:center;justify-content:center;overflow:hidden;border-radius:4px;color:#fff;font-size:9px;font-weight:600;line-height:1}',
      '.wh-site-letter{position:relative;z-index:0}',
      '.wh-site-img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .12s ease}',
      '.wh-site[data-loaded=true] .wh-site-letter{display:none}',
      '.wh-site[data-loaded=true] .wh-site-img{opacity:1}',
      '.wh-item-title{font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-primary);text-decoration:none}',
      '.wh-item-title:hover{text-decoration:underline}',
      '.wh-item-meta{font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.wh-item-snippet{font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
    ]

    /** 14px stroked icon drawn from the card's own paths. */
    function CardIcon(props) {
      return h('svg', {
        viewBox: '0 0 16 16',
        width: 14,
        height: 14,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': 'true',
      }, props.paths.map((path, index) => h('path', { key: index, d: path })))
    }

    const GLOBE_PATH = [
      'M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Z',
      'M2.2 8h11.6',
      'M8 2c1.75 1.75 2.6 3.75 2.6 6s-.85 4.25-2.6 6M8 2C6.25 3.75 5.4 5.75 5.4 8s.85 4.25 2.6 6',
    ]

    const DOCUMENT_PATH = [
      'M4.5 1.8h4.4l2.6 2.6v9.8h-7z',
      'M8.9 1.8v2.6h2.6',
      'M6.2 8.2h3.6M6.2 10.6h3.6',
    ]

    const CHEVRON_PATH = ['M4.5 6.2 8 9.7l3.5-3.5']

    /** Hostname without `www.`, used for display and the tile monogram. */
    function hostOf(url) {
      try {
        return new URL(url).hostname.replace(/^www\./, '')
      } catch {
        return url
      }
    }

    /** Stable muted colour per host, so a site keeps the same tile. */
    function hostHue(host) {
      let hash = 0
      for (let index = 0; index < host.length; index += 1) hash = (hash * 31 + host.charCodeAt(index)) % 360
      return hash
    }

    /**
     * Bundled provider marks. A provider's own favicon is not reliable — some are
     * a dark glyph on transparency and vanish on a dark surface — so the four
     * shipped providers carry a 32px image here, encoded once. An icon whose logo
     * needs a light ground names that ground; the rest paint on the page.
     */
    const PROVIDER_ICONS = {
      builtin: { src: 'data:image/png;base64,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', tile: null },
      anysearch: { src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABnElEQVR42u1XwU7DMAy1My/doVeO24Wf4MJ38I37Di78BBxgiAOnSROaEjePA+3UdVmXlm4FgaVKbaJaz46f/UL0142rF2OMiMiCiIr6+sAGIpqo6nMIQYmIpNoRkUWe548AzhsxM202m2vn3NMeACIqACgAbawPaZXvYhd44zgksj60yd7Rj12EqZGG8uliJiXAVACGmTtlK7WYJSFy45y7U9UHIpqUVDpF7UJEbqy1y8pHbwDMbLz39977t44Z8FmWEYBWACaRu7MefJ+lFkpqB+vT9QZjQV8LDQYdsOncAAwR2dq3vWQGNITwSkQKQMq6qN717ACccyvv/fwIQ3CRI0BCNxp9FvwaADwqAADbscaxAUDT6fSWmevDCETEANR7v4r++KUx52Xj4Vp3NKr6cqAJ2zJkrV1mWRbLzMd6vc5j1X5MY7ZpwtaWWk61vTEN4L3ln5jGbNWEXdRNBUBOFG5MY/5cTYgyRZo45Qwz64lx3PSnzVFdBzBhZunYnq9a9mL+hJmpZNO3rmY7GqrqKtbyj/g7uJr92ycb69Ipu7K+HQAAAABJRU5ErkJggg==', tile: '#f2f2f2' },
      exa: { src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADuElEQVR42u2XS2hcZRTHf999zOPOncmj+KioFUSIC2MFxdaF+FipBd1YW7CbioKPhJhWSRpsx0pM0DbExAdU7KZCH24qVLQU6sKKFTdtXBgVtbVqtDUmmdyZuXNfx8UNLSj1TqYjQfCDy7c533f/5/+d8z/nqBV3TQtLuDSWeC05AKMeI6Uau1ykCQBEIIoaA6BUMvhEACkTdF0RRRBGyS4pYnsFeL6QdMT4J/SeLww+m+Pe1Sn8ENoLioveJ/GZSGC2JGgabBsvc/CIR0teEYYNMCACly/TuPIyjZIjHPiwhq7HP+PCdh5wGIKVVay9P40CarUmPIEfxLttKT6fCNi1v0p7QSP4i0eaDnPzwqvP5VDAu+/XOPKpj21d3Pu6GDAN8ANh6pww/oLN6Z8jTk4GtFsQLgSnocPMnPDk+gy9G7NMTAZsGytjmk3QAU2LWegZdIgiYaQ/RzYDbi3ODhEoOcIN1+ls784xNy90Dzo4VSFlJKdiIoBIwMoojp8IKI5XuPF6neIzFuWqoGvxuxu6YkefTXurYstImYnJkLylzjN0yUooAm0Fxa79Loc+9tjwUIb1a9LMzgsVV3j+8SyrVxq8857Lvg9qtLWov8VIU6Q4ZSr6d5Y5MxUxvDnHiqt07lll0rUhyxdfBmx/o4JtqUUJV90A3JqggB+nIp4qOuga7B6y2dlnM1MSegYdPF/Q9fokuK4sUAqiMN73jRZA4nTzfKj5cHOHgQhs7Hf4+oeQ1nz91P83qqEseCwC63pKVF0ou8Kdt5oceC3PycmAZa0aI1tyfHMq4PszIdnMvxQDmXRcB65drvFm0SaMYuo3DTu0FRSjAzYpM1a9xZTvRT2B5wtDm3Jcs1yjb0eZ07+EHD3uM76nym03GWx92sKpxIWoqQCUgpmS8MQjGdbcnWLPQZe9h2q05hVWRvHK21U+OxHw2MMZ1j2QZmZOMPQmAdAUVFxh1UqDYpfFV9+FFF+vkMvGSqfrEITC5mGHP2aFl3tzdHbozFdipbxkAFEUF6TRARtNU/QOlam6kEnHdUIpKNiKb0+FbB0r05JXjA3Y2FmFFyTHg5ZEvR+AaSiuvkKj6yWHw8dqeJ5wdlqYnom/334Xggje2usysrtKZ4fBi905fL8JPaG5YOFUhNs7De64JZ/YkAjw6INpDh/z+OgTj4LdYEekFJydjvj1XIQfwtr70nW1ZD9NRWgapNPJsqySJiPTWKKm9ELug3iLnN58aV5brhSLEpamDyb1XvT/cNro+hMpK6CrQlQkAAAAAABJRU5ErkJggg==', tile: null },
      firecrawl: { src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD70lEQVR42sWXTWhcVRTHf+feN5OYjyYhTawtrUUsUk0X0mLNwo+6Eawggi0Igh8gWMFa6sKdSl00CxdSalCrKEpLwYJWaAURxEJFhW5s01aFklojJZpmvpI0M+/e4+K+dCZpMplMk3p3w7vzzv/8z//8z3miqsr/eEzd//QeFgF7/QCMAZEbBlI3AP/DYfTCmQAEAL1JALwP4QbPUXruXvzhPoiLIX4dTCwcgAYAsno9NMe4Q28R9z0DPr5JACqBeGDV7fiTR3AH94ZyeLfEAMQAio5cgshCqYh0duO/+wT9+4/wPGFpiQAIOI9+fwhp74BiEW5pQocH0YGfy52xJABcCUTwR/ejQ79DujGo33uwFv3nYlIeXQIAzoFNoed+Ij64B9rbwflywMjAeCb8jlKLDEA1ZDg8RNz3ApICTFTO1BgolmBZV+jUr/shf6UmfzC1qd2hhQzu7e2QvwhNLeBikAqAkoLOVcR9zxPv2wnphtokNe8wUg9icP2v4o6/h6xYDZNXg9hmnuZO+Pcv1KRJfzgAbZ1TYepkQBXEoJfO47/9FFm+AoqTswcHyAxBaytSGsOf+CIEdv4GSpCYij/2Plg347qCsdOzSzeBV4gi/PEDUMgGsFV8YX4GAB08H1qtsuYmgrFcUiIpl8s5aG3H/3kaf+yDINAqVTZVg0cpKI6jkzmIKlRvLTqeh56HgTTEpTIIIXHH5bgv34VCJjA1BwhTNfOBUxC7QHdl3W0E2Sxm02NEL/ejuQKYGbowFoo5/Mkj04ZYbQC8AxHi/a/gPt+DtN8asqw81iKNrUjvVkzPA5AbBWunzwzx+F9PVHVHM2v2xgKKLGvCffUOeuEUtHaE3rcR5EeROzZi7ns0kPPQtqCJ69zTQyFfRxdM0e080tISbqkm4zaGq0q0Yx+0doKA6XkwBCsVZ2nRhTqhSNJ+Ao3NUCqVW00EHclid32E3LM5MAKISaGlRmhoShwyuW8NNLfVwUBSL1mzrqz+KEJHhrHbdmMe2R4CmVBzn7lMtPtj7BO7AuViwHsUi+m5fzqrNVmxBtXr4GlKO3uRrk7IZ2HtJlJ7vwGxFcsooSwmgkKG0ovrIUqyL0ySOnAWOrqvvbN2DahH1m7A9D4JuVF0YgL7+A6wqetbykTBgFraMFuehokxdOQKdutLIbj3czJg5tuA7bNvQEMHkrJI921V6FRAkA1b0Mt55M6NmKdeS5yynlkg4ZGsXEf05lFwaTSXmX/jyWagayXR65+F1q14V33j2DswFv3tl+ANd22+NqJn1c3ZH6GlHVlz9+z3Fgxg6mPEmIWv7WIWYSGZ9kEic+8CC723YABLdP4D1RjAN71H2GUAAAAASUVORK5CYII=', tile: null },
      tavily: { src: 'data:image/png;base64,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', tile: null },
    }

    /** One provider mark from the bundle, or null for an unknown provider. */
    function ProviderIcon(props) {
      const { id, size = 14 } = props
      const icon = PROVIDER_ICONS[id]
      if (icon === undefined) return null
      return h('span', {
        className: 'wh-provider',
        'aria-hidden': 'true',
        style: {
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.round(size / 3)}px`,
          background: icon.tile ?? 'transparent',
        },
      }, h('img', { className: 'wh-provider-img', src: icon.src, alt: '', width: size, height: size }))
    }

    /** Provider id of a wire tool name (`tavily_crawl` -> `tavily`). */
    function providerId(toolName) {
      const cut = toolName.indexOf('_')
      return cut === -1 ? toolName : toolName.slice(0, cut)
    }


    /** The leading mark of a row: bundled provider icon, else its favicon, else a glyph. */
    function providerMark(kind, toolName) {
      const id = providerId(toolName)
      const bundled = ProviderIcon({ id, size: 16 })
      if (bundled !== null) return bundled
      const host = PROVIDER_HOSTS[id]
      if (host !== undefined) return h(SiteIcon, { url: `https://${host}`, size: 14 })
      return h(CardIcon, { paths: kind === 'search' ? GLOBE_PATH : DOCUMENT_PATH })
    }

    /** Distinct result hosts in order, for the marks shown before expanding. */
    function distinctHosts(sources) {
      const seen = new Set()
      const hosts = []
      for (const source of sources) {
        const host = hostOf(source.url)
        if (seen.has(host)) continue
        seen.add(host)
        hosts.push(host)
      }
      return hosts
    }

    /** Whether a value is a URL the browser can open and read a host from. */
    function hasHttpUrl(url) {
      try {
        const { protocol } = new URL(url)
        return protocol === 'http:' || protocol === 'https:'
      } catch {
        return false
      }
    }

    /**
     * A site's mark: its favicon once the browser loads it, otherwise a letter
     * tile. The image is lazy and sends no referrer, and a failure keeps the
     * tile, so the card never shows a broken image.
     */
    function SiteIcon(props) {
      const { url, favicon, size = 16 } = props
      const host = hostOf(url)
      const [loaded, setLoaded] = React.useState(false)
      const [failed, setFailed] = React.useState(false)
      const src = typeof favicon === 'string' && favicon.length > 0 ? favicon : `https://${host}/favicon.ico`
      return h('span', {
        className: 'wh-site',
        'data-loaded': loaded,
        'aria-hidden': 'true',
        style: {
          width: `${size}px`,
          height: `${size}px`,
          background: loaded ? 'transparent' : `hsl(${hostHue(host)} 38% 42%)`,
        },
      },
        h('span', { className: 'wh-site-letter' }, host.slice(0, 1).toUpperCase()),
        failed
          ? null
          : h('img', {
            className: 'wh-site-img',
            src,
            alt: '',
            loading: 'lazy',
            referrerPolicy: 'no-referrer',
            onLoad: () => setLoaded(true),
            onError: () => setFailed(true),
          }))
    }

    /** The call head of any Tool phase; its arguments are a JSON string. */
    function callOf(block) {
      if (block === undefined || block === null) return undefined
      return 'kind' in block ? block.call ?? undefined : block
    }

    /** Parsed call arguments, or undefined while they are still incomplete. */
    function callArguments(block) {
      const call = callOf(block)
      if (call === undefined || typeof call.argsRaw !== 'string') return undefined
      try {
        const value = JSON.parse(call.argsRaw)
        return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : undefined
      } catch {
        return undefined
      }
    }

    /** Every text block of a settled result, joined the way the model saw them. */
    function resultText(block) {
      const content = block !== undefined && block !== null && Array.isArray(block.content) ? block.content : []
      return content
        .filter(part => part !== null && typeof part === 'object' && part.type === 'text' && typeof part.text === 'string')
        .map(part => part.text)
        .join('\n\n')
    }

    /** Host plus path for a URL we could not parse. */
    function displayUrl(url) {
      try {
        const parsed = new URL(url)
        return `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`
      } catch {
        return url
      }
    }

    /** One source, narrowed to the fields the card renders. */
    function cardSource(value) {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
      if (typeof value.url !== 'string') return undefined
      return {
        url: value.url,
        ...typeof value.title === 'string' ? { title: value.title } : {},
        ...typeof value.snippet === 'string' ? { snippet: value.snippet } : {},
        ...typeof value.publishedAt === 'string' ? { publishedAt: value.publishedAt } : {},
        ...typeof value.favicon === 'string' ? { favicon: value.favicon } : {},
      }
    }

    /** Card data for a settled search, or undefined for the text fallback. */
    function searchCard(block) {
      if (block === undefined || block === null || block.isError === true) return undefined
      const meta = block.meta
      if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) return undefined
      if (typeof meta.truncated !== 'boolean' || !Array.isArray(meta.sources)) return undefined
      const sources = meta.sources.map(cardSource)
      if (sources.some(source => source === undefined)) return undefined
      return { kind: 'search', sources, truncated: meta.truncated }
    }

    /** Card data for a fetched page, or undefined for the text fallback. */
    function fetchCard(block) {
      if (block === undefined || block === null || block.isError === true) return undefined
      const meta = block.meta
      if (meta === null || typeof meta !== 'object' || Array.isArray(meta)) return undefined
      if (typeof meta.url !== 'string' || typeof meta.truncated !== 'boolean') return undefined
      if (!Number.isInteger(meta.statusCode)) return undefined
      return { kind: 'fetch', url: meta.url, statusCode: meta.statusCode, truncated: meta.truncated }
    }

    /** One source list entry. */
    /** A provider date for display: an ISO timestamp shortens to its day. */
    function shortDate(value) {
      if (typeof value !== 'string' || value.length === 0) return undefined
      const day = /^(\d{4}-\d{2}-\d{2})T/.exec(value)
      return day !== null ? day[1] : value
    }

    function SourceItem(props) {
      const { source, index } = props
      const label = typeof source.title === 'string' && source.title.length > 0 ? source.title : displayUrl(source.url)
      const meta = [displayUrl(source.url), shortDate(source.publishedAt)]
        .filter(part => typeof part === 'string' && part.length > 0)
        .join(' · ')
      return h('div', { className: 'wh-item' },
        // The ordinal is what makes a result countable at a glance, and what a
        // reader can cite back ("the third one").
        h('span', { className: 'wh-item-index' }, String(index + 1)),
        h('span', { className: 'wh-item-mark' }, h(SiteIcon, { url: source.url, favicon: source.favicon })),
        h('div', { className: 'wh-item-main' },
          h('a', { className: 'wh-item-title', href: source.url, target: '_blank', rel: 'noreferrer noopener' }, label),
          meta.length > 0 ? h('span', { className: 'wh-item-meta' }, meta) : null,
          typeof source.snippet === 'string' && source.snippet.length > 0
            ? h('span', { className: 'wh-item-snippet' }, source.snippet)
            : null))
    }

    /** The opened body: source entries, or the raw text when they are unknown. */
    function CardBody(props) {
      const { t, kind, card, text } = props
      if (card !== undefined && kind === 'search') {
        return h('div', { className: 'wh-card-body' },
          card.sources.length === 0
            ? h('p', { className: 'wh-card-empty' }, t('cardNoResults'))
            : card.sources.map((source, index) => h(SourceItem, { key: index, source, index })),
          card.truncated ? h('p', { className: 'wh-card-empty' }, t('cardSourcesTruncated')) : null)
      }
      return h('div', { className: 'wh-card-body' },
        text.length === 0 ? null : h('pre', { className: 'wh-card-text' }, text))
    }

    /** Degrade a crashing card to the model-facing text. */
    class CardBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false }
      }

      static getDerivedStateFromError() {
        return { failed: true }
      }

      render() {
        if (!this.state.failed) return this.props.children
        if (this.props.text.length === 0) return null
        return h('pre', { className: 'wh-card-text' }, this.props.text)
      }
    }

    function ToolCard(props) {
      const { t, kind, phase, block, toolName } = props
      const [open, setOpen] = React.useState(false)
      const args = callArguments(block)
      const card = kind === 'search' ? searchCard(block) : fetchCard(block)
      const text = resultText(block)
      const running = phase !== 'result'
      const failed = phase === 'result' && block !== undefined && block !== null && block.isError === true
      const query = args !== undefined && typeof args.query === 'string'
        ? args.query
        : (Array.isArray(args?.queries) && typeof args.queries[0] === 'string' ? args.queries[0] : '')
      const extraQueries = Array.isArray(args?.queries) && args.queries.length > 1 ? args.queries.length - 1 : 0
      const url = args !== undefined && typeof args.url === 'string' ? args.url : ''
      const count = card !== undefined && card.kind === 'search' ? t('cardCount', { count: card.sources.length }) : ''
      const hosts = card !== undefined && card.kind === 'search' ? distinctHosts(card.sources) : []
      const marks = hosts.slice(0, 3)
      const extraHosts = hosts.length - marks.length
      // A search opens to its sources; a fetch is one line, because the row already
      // names the page and links to it. Only a failure opens, to show its error.
      const expandable = failed
        ? text.length > 0
        : kind === 'search' && !running && (card !== undefined || text.length > 0)
      const status = failed
        ? t('cardFailed')
        : running ? t('cardRunning') : (kind === 'search' ? count : '')
      const toggle = () => { if (expandable) setOpen(value => !value) }

      // The row itself is only a pointer convenience; the chevron is the real
      // control, so a keyboard and a screen reader get one button whose state
      // they can read, and the URL keeps its own link semantics.
      const row = h('div', {
        className: failed ? 'wh-card-row wh-card-failed' : 'wh-card-row',
        title: toolName,
        'data-expandable': expandable,
        onClick: expandable ? toggle : undefined,
      },
        h('span', { className: 'wh-card-icon' }, providerMark(kind, toolName)),
        h('span', { className: 'wh-card-label' },
          t(kind === 'search' ? 'cardSearch' : 'cardExtract'),
          h('span', { className: 'wh-card-provider' }, ` · ${providerTitle(toolName)}`)),
        query.length > 0
          ? h('span', { className: 'wh-card-summary' },
            extraQueries > 0 ? `${query} +${extraQueries}` : query)
          : (hasHttpUrl(url)
            ? h('a', {
              className: 'wh-card-summary wh-card-link',
              href: url,
              target: '_blank',
              rel: 'noreferrer noopener',
              onClick: event => event.stopPropagation(),
            }, displayUrl(url))
            : null),
        kind === 'search' && marks.length > 0
          ? h('span', { className: 'wh-card-marks' },
            marks.map(host => h(SiteIcon, { key: host, url: `https://${host}`, size: 14 })),
            extraHosts > 0 ? h('span', { className: 'wh-card-more' }, `+${extraHosts}`) : null)
          : null,
        kind === 'fetch' && hasHttpUrl(url)
          ? h(SiteIcon, { url, size: 14 })
          : null,
        status.length > 0 ? h('span', { className: 'wh-card-meta' }, status) : null,
        expandable
          ? h('button', {
            type: 'button',
            className: 'wh-card-chevron',
            'aria-expanded': open,
            'aria-label': t(open ? 'cardCollapse' : 'cardExpand'),
            onClick: (event) => {
              event.stopPropagation()
              toggle()
            },
          }, h(CardIcon, { paths: CHEVRON_PATH }))
          : null)

      return h('div', { className: 'wh-card' },
        row,
        open && expandable ? h(CardBody, { t, kind, card, text }) : null)
    }

    function SearchCard(props) {
      return h(React.Fragment, null,
        h('style', null, CARD_STYLES),
        h(CardBoundary, { text: resultText(props.block) }, h(ToolCard, { ...props, kind: 'search' })))
    }

    function ExtractCard(props) {
      return h(React.Fragment, null,
        h('style', null, CARD_STYLES),
        h(CardBoundary, { text: resultText(props.block) }, h(ToolCard, { ...props, kind: 'fetch' })))
    }

    /**
     * One tool, as a card: the whole card toggles it, so the pointer does not
     * have to find the switch. The switch stays the focusable control, and a
     * click on it is left to its own handler.
     */
    function ToolSwitchCard(props) {
      const { t, name, checked, busy, keyOnly, onToggle } = props
      return h('div', {
        className: 'wh-tool',
        'data-on': checked ? 'true' : 'false',
        'data-busy': busy ? 'true' : 'false',
        onClick: () => {
          if (!busy) onToggle(name, !checked)
        },
      },
      h('div', { className: 'wh-tool-main' },
        h('span', { className: 'wh-name', title: name }, name),
        h('span', {
          className: 'wh-tool-switch',
          onClick: event => event.stopPropagation(),
        }, h(UI.Switch, {
          checked,
          label: name,
          disabled: busy,
          onChange: next => onToggle(name, next),
        }))),
      keyOnly === true ? h('span', { className: 'wh-note' }, t('needKey')) : null)
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
          h('span', { className: 'wh-group-title' },
            h(ProviderIcon, { id: group.id, size: 16 }),
            h('span', { className: 'wh-group-name' }, title)),
          h('span', { className: 'wh-group-tags' },
            h('span', {
              className: 'wh-group-count',
              title: t('enabledCount'),
            }, `${group.names.filter(name => enabled(name, tools)).length}/${group.names.length}`),
            // Only the abnormal state has to interrupt a scan.
            provider !== undefined && keyRef.length > 0 && !configured
              ? h('span', { className: 'wh-chip' }, t('keyUnset'))
              : null,
            provider !== undefined && keyRef.length === 0
              ? h('span', { className: 'wh-chip wh-chip-quiet' }, t('keyFree'))
              : null)),
        h('div', { className: 'wh-grid' },
          group.names.map(name => h(ToolSwitchCard, {
            key: name,
            t,
            name,
            checked: enabled(name, tools),
            busy,
            keyOnly: KEY_ONLY.has(name) && !configured,
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
        readSettings = () => controller.state.value ?? {}
        ctx.effect(() => () => controller.dispose(), 'dsh-web-hub: controller')
        ctx.effect(
          () => ctx.on('connection/reset', () => { void controller.load() }),
          'dsh-web-hub: reconnect refresh',
        )
        ctx.slots.inject('tool.call.toolview', function* () {
          for (const [tool, kind] of Object.entries(CARD_KINDS)) {
            yield ctx.slots.register(
              { name: 'tool.call.toolview', key: tool, locale: NS },
              kind === 'search' ? SearchCard : ExtractCard,
            )
          }
        })
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
