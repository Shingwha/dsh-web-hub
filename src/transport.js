/**
 * Minimal MCP transport over Streamable HTTP, plus the header helper every
 * provider shares.
 *
 * Every provider endpoint we use is stateless: one JSON-RPC `tools/call` is the
 * whole conversation, with no handshake and no session id. Providers supply
 * only their own headers, and a failure becomes one readable message here so
 * every tool reports the same way.
 */

/** Default request headers: provider tag plus the accept types an SSE reply needs. */
export function requestHeaders(providerId, extra = {}) {
  return {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    [`x-${providerId}-client`]: 'dsh-web-hub',
    ...extra,
  }
}

/** Authorization header for a configured key, or an empty object. */
export function bearer(key) {
  return typeof key === 'string' && key.length > 0 ? { authorization: `Bearer ${key}` } : {}
}

/** Decode one JSON-RPC payload, tolerating both a JSON body and an SSE frame. */
function parsePayload(text) {
  const trimmed = text.trim()
  if (trimmed.length === 0) return undefined
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed)
  for (const line of trimmed.split(/\r?\n/)) {
    if (!line.startsWith('data:')) continue
    const body = line.slice(5).trim()
    if (body.length === 0 || body === '[DONE]') continue
    return JSON.parse(body)
  }
  return undefined
}


/** A dropped connection or a cold DNS lookup fails the first fetch and not the second. */
function transient(error) {
  if (error === null || typeof error !== 'object') return false
  return error.name === 'TypeError' || error.cause !== undefined
}

/**
 * Run one request, retrying a transient network failure once.
 *
 * These calls are read-only, and the observed failure mode is a connection that
 * fails once and succeeds immediately after, so one retry costs little and turns
 * an intermittent outage into a slow call.
 */
async function once(request, signal) {
  try {
    return await request()
  } catch (error) {
    if (signal?.aborted === true || !transient(error)) throw error
    await new Promise(resolve => setTimeout(resolve, 250))
    return request()
  }
}

/** Turn an HTTP failure into one actionable line. */
function failure(status, body) {
  const excerpt = body.trim().slice(0, 200)
  if (status === 401 || status === 403) {
    return new Error(`the provider rejected the credential (HTTP ${status}); check the key in Plugins · dsh-web-hub`)
  }
  if (status === 402) return new Error(`the provider reports no remaining balance (HTTP 402): ${excerpt}`)
  if (status === 429) return new Error('rate limit reached; configure an API key for a higher limit')
  return new Error(`HTTP ${status} ${excerpt}`)
}

/**
 * Call one tool on a remote MCP server and flatten its text blocks.
 *
 * @param input.url endpoint of the MCP server
 * @param input.name remote tool name
 * @param input.args tool arguments
 * @param input.headers extra request headers (authentication, provider tags)
 * @param input.signal caller cancellation
 * @returns `{ text, meta }`: the tool's text output and the provider's `_meta`
 */
export async function callTool({ url, name, args, headers = {}, signal }) {
  const request = () => fetch(url, {
    method: 'POST',
    signal,
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  })

  const response = await once(request, signal)
  const text = await response.text()
  if (!response.ok) throw failure(response.status, text)

  const payload = parsePayload(text)
  if (payload === undefined) throw new Error('empty response')
  if (payload.error !== undefined) throw new Error(payload.error?.message ?? JSON.stringify(payload.error))

  const result = payload.result ?? {}
  const blocks = Array.isArray(result.content) ? result.content : []
  const body = blocks
    .filter(block => block && block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n\n')

  if (result.isError === true) throw new Error(body.length > 0 ? body : 'the provider reported an error')
  return { text: body, meta: result._meta ?? {} }
}

/**
 * Bind one provider's endpoint and headers into a sender.
 *
 * @param provider the provider spec, which owns its header shape
 * @param cfg resolved provider settings (endpoint, limits)
 * @param key the resolved credential, when the provider has one
 * @returns `(toolName, args, signal) => text`
 */
export function createTransport(provider, cfg, key) {
  const headers = provider.headers(key)
  return (name, args, signal) => callTool({ url: cfg.baseURL, headers, name, args, signal })
}
