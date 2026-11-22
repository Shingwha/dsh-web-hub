/** Provider parsers, pinned to recorded provider payloads. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import anysearch from '../src/providers/anysearch.js'
import exa from '../src/providers/exa.js'
import firecrawl from '../src/providers/firecrawl.js'
import tavily from '../src/providers/tavily.js'

const fixture = name => readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8')
const cfg = { baseURL: 'https://example.invalid', maxResults: 2, timeoutMs: 1000 }

const parse = (provider, key, name, args = {}) =>
  provider.tools[key].parse(fixture(name), { args, cfg })

test('anysearch search reads its numbered markdown and its date', () => {
  const result = parse(anysearch, 'search', 'anysearch-search.txt')
  assert.equal(result.meta.sources.length, 2)
  assert.deepEqual(result.meta.sources[0], {
    title: 'DeepSeek Harness: Everything is a Plugin.',
    url: 'https://github.com/deepseek-ai/deepseek-harness',
    snippet: 'DeepSeek Harness is an open-source agent harness built on Cordis.',
    publishedAt: 'Aug 12, 2026',
  })
  assert.match(result.text, /^External web content/)
})


test('anysearch batch search keeps each query apart', () => {
  const result = parse(anysearch, 'batch_search', 'anysearch-batch.txt')
  assert.deepEqual(result.meta.sources.map(item => item.group), [
    'cordis fiber dispose',
    'cordis fiber dispose',
    'dsh tool registration',
  ])
  assert.match(result.text, /Query: cordis fiber dispose\n\nSources:/)
  assert.match(result.text, /Query: dsh tool registration\n\nSources:/)
})

test('anysearch extract lifts the JSON envelope into page text', () => {
  const result = parse(anysearch, 'extract', 'anysearch-extract.json', { url: 'https://example.com' })
  assert.equal(result.meta.url, 'https://example.com')
  assert.match(result.text, /^# Example Domain\n\nSource: https:\/\/example\.com\n\nThis domain/)
})

test('exa search reads its labelled blocks and skips a missing date', () => {
  const result = parse(exa, 'search', 'exa-search.txt')
  assert.equal(result.meta.sources.length, 2)
  assert.equal(result.meta.sources[0].publishedAt, '2026-08-12T00:00:00.000Z')
  assert.equal(result.meta.sources[1].publishedAt, undefined)
})

test('exa extract keeps the page text and reports the url', () => {
  const result = parse(exa, 'extract', 'exa-fetch.txt', { url: 'https://example.com' })
  assert.equal(result.meta.url, 'https://example.com')
  assert.match(result.text, /Example Domain/)
})

test('tavily search projects the provider date field', () => {
  const result = parse(tavily, 'search', 'tavily-search.json')
  assert.equal(result.meta.sources[0].publishedAt, '2026-08-13T16:47:55Z')
  assert.equal(result.meta.sources[1].publishedAt, undefined)
})

test('tavily extract returns the page body', () => {
  const result = parse(tavily, 'extract', 'tavily-extract.json', { url: 'https://example.com' })
  assert.match(result.text, /^https:\/\/example\.com\n\n# Example/)
})

test('tavily crawl turns pages into sources', () => {
  const result = parse(tavily, 'crawl', 'tavily-crawl.json')
  assert.deepEqual(result.meta.sources.map(item => item.url), ['https://docs.example/a', 'https://docs.example/b'])
})

test('tavily research reads its report and sources', () => {
  const result = parse(tavily, 'research', 'tavily-research.json')
  assert.match(result.text, /^Cordis is the plugin runtime under DeepSeek Harness\.\n\nExternal web content/)
  assert.match(result.text, /Sources:\n- \[Cordis\]\(https:\/\/a\.example\/cordis\)/)
  assert.deepEqual(result.meta.sources.map(item => item.url), ['https://a.example/cordis'])
})

test('firecrawl search reads its web list', () => {
  const result = parse(firecrawl, 'search', 'firecrawl-search.json')
  assert.equal(result.meta.sources.length, 1)
  assert.equal(result.meta.sources[0].snippet, 'desc a')
})

test('firecrawl scrape keeps the page and its reported status', () => {
  const result = parse(firecrawl, 'extract', 'firecrawl-scrape.json', { url: 'https://example.com' })
  assert.equal(result.meta.statusCode, 200)
  assert.equal(result.meta.url, 'https://example.com')
  assert.match(result.text, /^# Example Domain\n\nhttps:\/\/example\.com\n\n# Example/)
})

test('tavily reports a keyless cap as an error, not a payload', () => {
  const capped = JSON.stringify({ code: 'daily_cap_reached', message: 'slow down', retry_after: 30 })
  assert.throws(
    () => tavily.tools.search.parse(capped, { args: {}, cfg }),
    /daily_cap_reached \(retry after 30s\): slow down/,
  )
})

test('firecrawl reports a refusal as an error', () => {
  const refused = JSON.stringify({ success: false, error: 'no key' })
  assert.throws(() => firecrawl.tools.extract.parse(refused, { args: { url: 'u' }, cfg }), /no key/)
})
