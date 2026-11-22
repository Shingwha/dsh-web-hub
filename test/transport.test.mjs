/** Transport: payload handling, provider meta, and the transient-failure retry. */
import assert from 'node:assert/strict'
import test from 'node:test'
import { callTool } from '../src/transport.js'

/** Replace fetch for one test, restoring it afterwards. */
async function withFetch(impl, run) {
  const original = globalThis.fetch
  globalThis.fetch = impl
  try {
    return await run()
  } finally {
    globalThis.fetch = original
  }
}

const reply = (payload) => async () => new Response(JSON.stringify(payload), { status: 200 })

test('text and the provider meta both come back', async () => {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    result: { content: [{ type: 'text', text: 'hello' }], _meta: { request_id: 'r1' } },
  }
  const out = await withFetch(reply(payload), () => callTool({ url: 'https://a.invalid', name: 'x', args: {} }))
  assert.deepEqual(out, { text: 'hello', meta: { request_id: 'r1' } })
})

test('an SSE frame is decoded like a JSON body', async () => {
  const frame = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"sse"}]}}\n\n'
  const out = await withFetch(async () => new Response(frame, { status: 200 }), () =>
    callTool({ url: 'https://a.invalid', name: 'x', args: {} }))
  assert.equal(out.text, 'sse')
  assert.deepEqual(out.meta, {})
})

test('a dropped connection is retried once', async () => {
  let attempts = 0
  const impl = async () => {
    attempts += 1
    if (attempts === 1) throw new TypeError('fetch failed')
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: 'ok' }] } }), { status: 200 })
  }
  const out = await withFetch(impl, () => callTool({ url: 'https://a.invalid', name: 'x', args: {} }))
  assert.equal(out.text, 'ok')
  assert.equal(attempts, 2)
})

test('a refusal is one readable error', async () => {
  await withFetch(async () => new Response('nope', { status: 429 }), async () => {
    await assert.rejects(callTool({ url: 'https://a.invalid', name: 'x', args: {} }), /rate limit reached/)
  })
})
