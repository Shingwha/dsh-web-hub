/** The catalog is derived once, and the client's copy must match it. */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { catalog } from '../src/catalog.js'
import { providers } from '../src/providers/index.js'

const CLIENT = fileURLToPath(new URL('../client.js', import.meta.url))

test('every provider tool appears once, with a stable wire name', () => {
  const { tools } = catalog()
  const expected = Object.values(providers).flatMap(provider =>
    Object.keys(provider.tools).map(key => `${provider.id}_${key}`))
  assert.deepEqual(Object.keys(tools).sort(), expected.sort())
})

test('a card and a key requirement are declared where the tool is', () => {
  const { tools } = catalog()
  assert.equal(tools.anysearch_search.card, 'search')
  assert.equal(tools.anysearch_extract.card, 'fetch')
  assert.equal(tools.tavily_research.card, undefined)
  assert.deepEqual(
    Object.keys(tools).filter(name => tools[name].needsKey === true),
    ['tavily_crawl', 'tavily_map', 'tavily_research'],
  )
})

test('the client catalog is current', () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/sync-client-catalog.mjs', import.meta.url)), '--check'], { stdio: 'pipe' })
  }, 'run `npm run sync` after changing a provider')
})

test('the client copy names every carded tool', () => {
  const source = readFileSync(CLIENT, 'utf8')
  const { tools } = catalog()
  for (const [name, meta] of Object.entries(tools)) {
    if (meta.card === undefined) continue
    assert.match(source, new RegExp(`${name}: '${meta.card}'`), `${name} is missing from client.js`)
  }
})
