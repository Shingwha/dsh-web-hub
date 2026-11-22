/** Argument mapping: what reaches the provider, and what deliberately does not. */
import assert from 'node:assert/strict'
import test from 'node:test'
import anysearch from '../src/providers/anysearch.js'
import exa from '../src/providers/exa.js'
import firecrawl from '../src/providers/firecrawl.js'
import tavily from '../src/providers/tavily.js'

const cfg = count => ({ baseURL: 'https://example.invalid', maxResults: count, timeoutMs: 1000 })

test('no configured count means the provider decides', () => {
  assert.deepEqual(anysearch.tools.search.args({ query: 'q' }, cfg(0)), { query: 'q' })
  assert.deepEqual(exa.tools.search.args({ query: 'q' }, cfg(0)), { query: 'q' })
  assert.deepEqual(firecrawl.tools.search.args({ query: 'q' }, cfg(0)), { query: 'q' })
  assert.deepEqual(tavily.tools.search.args({ query: 'q' }, cfg(0)), { query: 'q' })
})

test('a configured count is sent, in each provider’s own field name', () => {
  assert.deepEqual(anysearch.tools.search.args({ query: 'q' }, cfg(6)), { query: 'q', max_results: 6 })
  assert.deepEqual(exa.tools.search.args({ query: 'q' }, cfg(6)), { query: 'q', numResults: 6 })
  assert.deepEqual(firecrawl.tools.search.args({ query: 'q' }, cfg(6)), { query: 'q', limit: 6 })
  assert.deepEqual(tavily.tools.search.args({ query: 'q' }, cfg(6)), { query: 'q', max_results: 6 })
})

test('a count the model asked for wins over the configured one', () => {
  assert.deepEqual(anysearch.tools.search.args({ query: 'q', max_results: 3 }, cfg(9)), { query: 'q', max_results: 3 })
  assert.deepEqual(exa.tools.search.args({ query: 'q', max_results: 3 }, cfg(9)), { query: 'q', numResults: 3 })
})

test('search passes the caller’s own fields through untouched', () => {
  assert.deepEqual(
    anysearch.tools.search.args({ query: 'q', domain: 'code', sub_domain: 'code.doc' }, cfg(0)),
    { query: 'q', domain: 'code', sub_domain: 'code.doc' },
  )
})

test('a scrape asks only for what the output contract needs', () => {
  assert.deepEqual(firecrawl.tools.extract.args({ url: 'https://a.example' }), {
    url: 'https://a.example',
    formats: ['markdown'],
    onlyMainContent: true,
  })
  assert.deepEqual(tavily.tools.extract.args({ url: 'https://a.example' }), {
    urls: ['https://a.example'],
    format: 'markdown',
  })
})
