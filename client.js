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
      '.wh-group-name{font-size:14px;font-weight:500;line-height:20px}',
      '.wh-group-tags{display:flex;align-items:center;gap:8px}',
      '.wh-chip{font-size:11px;line-height:1.5;color:var(--dsw-alias-state-warning-primary,#b4690e);white-space:nowrap}',
      '.wh-chip-quiet{color:var(--dsw-alias-label-tertiary)}',
      '.wh-panel{padding:0 16px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform)}',
      '.wh-panel>*+*{border-top:0.5px solid var(--dsw-alias-border-l2)}',
      '.wh-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0}',
      '.wh-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;line-height:1.5}',
      '.wh-row-label{display:flex;align-items:center;gap:8px;min-width:0}',
      '.wh-note{font-size:10.5px;font-weight:500;line-height:1.6;padding:0 5px;border-radius:4px;background:rgba(180,105,14,0.14);color:var(--dsw-alias-state-warning-primary,#b4690e);white-space:nowrap}',
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

    /**
     * Every tool that renders through a card, with the card it gets. Search and
     * fetch are the only shapes so far: a list of sources, or one page.
     */
    const CARD_KINDS = {
      anysearch_search: 'search',
      anysearch_batch_search: 'search',
      exa_search: 'search',
      tavily_search: 'search',
      tavily_crawl: 'search',
      tavily_map: 'search',
      firecrawl_search: 'search',
      anysearch_extract: 'fetch',
      exa_extract: 'fetch',
      tavily_extract: 'fetch',
      firecrawl_extract: 'fetch',
    }

    /** Tools that only answer with a provider key; the panel says so when it is unset. */
    const KEY_ONLY = new Set(['tavily_crawl', 'tavily_map', 'tavily_research'])

    /** Card rules live with the card: the chat never mounts the plugin panel. */
    const CARD_STYLES = [
      '.wh-card{display:flex;flex-direction:column;gap:2px;color:var(--dsw-alias-label-tertiary)}',
      '.wh-card-row{display:flex;align-items:center;gap:8px;min-height:24px;padding:2px 0;border-radius:4px}',
      '.wh-card-row[data-expandable=true]{cursor:pointer}',
      '.wh-card-row[data-expandable=true]:hover{color:var(--dsw-alias-label-secondary)}',
      '.wh-card-failed{color:var(--dsw-alias-state-error-primary)}',
      '.wh-card-icon{flex:none;display:inline-flex;align-items:center;color:currentColor}',
      '.wh-card-label{flex:none;font-size:12.5px;line-height:1.5;color:var(--dsw-alias-label-secondary)}',
      '.wh-card-provider{color:var(--dsw-alias-label-tertiary)}',
      '.wh-card-summary{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12.5px;line-height:1.5}',
      '.wh-card-link{color:var(--dsw-alias-link);text-decoration:none}',
      '.wh-card-link:hover{text-decoration:underline}',
      '.wh-card-right{display:inline-flex;align-items:center;gap:8px;flex:none;margin-left:auto}',
      '.wh-card-marks{display:inline-flex;align-items:center;gap:4px;flex:none}',
      '.wh-card-more{font-size:10px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-card-meta{flex:none;font-size:11px;line-height:1.5;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}',
      '.wh-card-failed .wh-card-meta{color:inherit}',
      '.wh-card-chevron{flex:none;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin:0;padding:0;border:0;background:none;color:inherit;cursor:pointer;transition:transform .12s ease}',
      '.wh-card-chevron[aria-expanded=true]{transform:rotate(180deg)}',
      '.wh-card-body{display:flex;flex-direction:column;gap:10px;padding:4px 0 10px 22px}',
      '.wh-card-empty{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}',
      '.wh-card-text{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary)}',
      '.wh-item{display:flex;gap:8px;min-width:0}',
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

    /** Home host of each provider, whose favicon marks the row. */
    const PROVIDER_HOSTS = {
      anysearch: 'anysearch.com',
      exa: 'exa.ai',
      tavily: 'tavily.com',
      firecrawl: 'firecrawl.dev',
    }

    /** Provider id of a wire tool name (`tavily_crawl` -> `tavily`). */
    function providerId(toolName) {
      const cut = toolName.indexOf('_')
      return cut === -1 ? toolName : toolName.slice(0, cut)
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
    function SourceItem(props) {
      const { source } = props
      const label = typeof source.title === 'string' && source.title.length > 0 ? source.title : displayUrl(source.url)
      const meta = [displayUrl(source.url), source.publishedAt]
        .filter(part => typeof part === 'string' && part.length > 0)
        .join(' · ')
      return h('div', { className: 'wh-item' },
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
            : card.sources.map((source, index) => h(SourceItem, { key: index, source })),
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
        h('span', { className: 'wh-card-icon' },
          PROVIDER_HOSTS[providerId(toolName)] !== undefined
            ? h(SiteIcon, { url: `https://${PROVIDER_HOSTS[providerId(toolName)]}`, size: 14 })
            : h(CardIcon, { paths: kind === 'search' ? GLOBE_PATH : DOCUMENT_PATH })),
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
        h('span', { className: 'wh-card-right' },
          kind === 'search' && marks.length > 0
            ? h('span', { className: 'wh-card-marks' },
              marks.map(host => h(SiteIcon, { key: host, url: `https://${host}`, size: 14 })),
              extraHosts > 0 ? h('span', { className: 'wh-card-more' }, `+${extraHosts}`) : null)
            : null,
          kind === 'fetch' && hasHttpUrl(url)
            ? h(SiteIcon, { url, size: 14 })
            : null,
          status.length > 0 ? h('span', { className: 'wh-card-meta' }, status) : null),
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

    function ToolRow(props) {
      const { t, name, checked, busy, keyOnly, onToggle } = props
      return h('div', { className: 'wh-row' },
        h('span', { className: 'wh-row-label' },
          h('span', { className: 'wh-name' }, name),
          keyOnly === true ? h('span', { className: 'wh-note' }, t('needKey')) : null),
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
