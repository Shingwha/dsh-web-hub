/**
 * The client plugin, exercised without a browser: load the module the loader
 * would load, then walk the component trees it registers.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { catalog } from '../src/catalog.js'

const CLIENT = fileURLToPath(new URL('../client.js', import.meta.url))

/** Minimal React stand-in: elements are plain objects, hooks return fixed state. */
const React = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  Fragment: 'fragment',
  Component: class { constructor(props) { this.props = props } },
  useState: initial => [typeof initial === 'function' ? initial() : initial, () => {}],
  useId: () => 'id',
  useMemo: fn => fn(),
  createContext: () => ({}),
}

/** Load client.js the way the browser module loader does. */
async function load(settings = {}) {
  let definition
  const previous = globalThis.window
  globalThis.window = { __ModuleLoader__: { load: value => { definition = value } } }
  new Function(readFileSync(CLIENT, 'utf8'))()
  globalThis.window = previous

  const registrations = []
  const ctx = {
    slots: {
      inject: (_id, callback) => {
        const result = callback()
        if (result !== null && typeof result === 'object' && typeof result[Symbol.iterator] === 'function') {
          for (const _ of result) { /* drain the generator so every yield registers */ }
        }
      },
      register: (registration, component) => {
        registrations.push({ registration, component })
        return () => {}
      },
    },
    locale: { register: () => () => {}, bind: () => key => key },
    remote: {
      settings: {
        describe: async () => ({
          ok: true,
          value: { namespaces: [{ ns: 'web-hub', revision: 1, value: { tools: {}, providers: {}, ...settings } }] },
        }),
      },
      credentials: { status: async () => ({}) },
    },
    effect: fn => { fn() },
    on: () => () => {},
    get: () => undefined,
  }
  definition.factory(name => (name === 'react' ? React : {})).apply(ctx)
  await new Promise(resolve => setTimeout(resolve, 20))
  return { definition, registrations }
}

/** Walk a component tree, collecting class names and image sources. */
function walk(node, out = []) {
  if (node === null || node === undefined || typeof node !== 'object') return out
  if (Array.isArray(node)) {
    for (const child of node) walk(child, out)
    return out
  }
  if (typeof node.type === 'function') {
    const children = node.children.length === 0 ? undefined
      : node.children.length === 1 ? node.children[0] : node.children
    const props = children === undefined ? { ...node.props } : { ...node.props, children }
    const rendered = node.type.prototype?.render !== undefined
      ? new node.type(props).render()
      : node.type(props)
    return walk(rendered, out)
  }
  if (node.type === 'img') out.push({ className: node.props.className, src: node.props.src })
  else if (node.type === 'a') out.push({ className: node.props.className, href: node.props.href })
  else if (node.props?.className) out.push({ className: node.props.className })
  for (const child of node.children ?? []) walk(child, out)
  return out
}


/** Walk a tree into nodes carrying the facts a panel test looks at. */
function walkNodes(node, out = []) {
  if (node === null || node === undefined || typeof node !== 'object') {
    if (typeof node === 'string' && node.trim().length > 0) out.push({ text: node })
    return out
  }
  if (Array.isArray(node)) {
    for (const child of node) walkNodes(child, out)
    return out
  }
  if (typeof node.type === 'function') {
    const children = node.children.length === 0 ? undefined
      : node.children.length === 1 ? node.children[0] : node.children
    const props = children === undefined ? { ...node.props } : { ...node.props, children }
    return walkNodes(node.type.prototype?.render !== undefined ? new node.type(props).render() : node.type(props), out)
  }
  out.push({
    type: node.type,
    className: node.props?.className,
    href: node.props?.href,
    src: node.props?.src,
    on: node.props?.['data-on'],
    text: typeof node.props?.children === 'string' ? node.props.children : undefined,
  })
  for (const child of node.children ?? []) walkNodes(child, out)
  return out
}

const t = (key, params) => (params === undefined ? key : `${key}:${JSON.stringify(params)}`)

test('every carded tool registers a view, and nothing else does', async () => {
  const { registrations } = await load()
  const views = registrations.filter(entry => entry.registration.name === 'tool.call.toolview')
  const carded = Object.keys(catalog().tools).filter(name => catalog().tools[name].card !== undefined)
  assert.deepEqual(views.map(entry => entry.registration.key).sort(), carded.sort())
})

test('the panel still registers alongside the cards', async () => {
  const { registrations } = await load()
  assert.ok(registrations.some(entry => entry.registration.name === 'plugins.bundle.config'))
})

test('a search row is one line: provider mark, action, marks, count, chevron', async () => {
  const { registrations } = await load()
  const view = registrations.find(entry => entry.registration.key === 'anysearch_search').component
  const block = {
    kind: 'result',
    isError: false,
    content: [{ type: 'text', text: 'x' }],
    call: { name: 'anysearch_search', argsRaw: JSON.stringify({ query: 'deepseek harness' }) },
    meta: { truncated: false, sources: [{ url: 'https://github.com/a' }, { url: 'https://deepseek.com/b' }] },
  }
  const nodes = walk(view({ t, phase: 'result', toolName: 'anysearch_search', block, useDisclosure: () => ({}) }))
  const classes = nodes.map(node => node.className)
  assert.ok(classes.includes('wh-card-row'))
  assert.ok(classes.includes('wh-card-marks'))
  assert.ok(!classes.includes('wh-card-body'), 'the body stays closed by default')
  assert.equal(nodes.filter(node => node.src?.startsWith('data:image')).length, 1, 'provider mark is bundled')
})

test('a fetch row links the page and never opens', async () => {
  const { registrations } = await load()
  const view = registrations.find(entry => entry.registration.key === 'firecrawl_extract').component
  const block = {
    kind: 'result',
    isError: false,
    content: [{ type: 'text', text: 'x' }],
    call: { name: 'firecrawl_extract', argsRaw: JSON.stringify({ url: 'https://example.com' }) },
    meta: { truncated: false, url: 'https://example.com', statusCode: 200 },
  }
  const nodes = walk(view({ t, phase: 'result', toolName: 'firecrawl_extract', block, useDisclosure: () => ({}) }))
  assert.ok(nodes.some(node => node.href === 'https://example.com'))
  assert.ok(!nodes.some(node => node.className === 'wh-card-chevron'))
})

test('the panel lays tools out as cards, one per tool', async () => {
  const { registrations } = await load()
  const panel = registrations.find(entry => entry.registration.name === 'plugins.bundle.config').component
  const state = {
    status: 'ready',
    value: {
      tools: { anysearch_search: true, anysearch_extract: false, tavily_crawl: false },
      providers: {
        anysearch: { title: 'AnySearch', keyRef: 'ANYSEARCH_API_KEY' },
        tavily: { title: 'Tavily', keyRef: 'TAVILY_API_KEY' },
      },
    },
    keys: { ANYSEARCH_API_KEY: true, TAVILY_API_KEY: false },
    busy: false,
    error: '',
  }
  const nodes = walkNodes(panel({
    t,
    useWebHub: () => state,
    toggle: () => {},
    saveKey: async () => true,
    clearKey: async () => true,
    reload: () => {},
  }))
  const cards = nodes.filter(node => node.className === 'wh-tool')
  assert.equal(cards.length, 3, 'one card per tool')
  assert.deepEqual(cards.map(card => card.on), ['true', 'false', 'false'])
  assert.ok(nodes.some(node => node.className === 'wh-grid'), 'cards live in a wrapping grid')
  assert.ok(nodes.some(node => node.className === 'wh-group-count'), 'the group header counts enabled tools')
  assert.ok(nodes.some(node => node.text === '1/2'), 'one of two AnySearch tools is on')
  assert.ok(nodes.some(node => node.className === 'wh-note'), 'a key-only tool says so while unconfigured')
})
