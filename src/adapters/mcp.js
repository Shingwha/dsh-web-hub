/**
 * Minimal MCP transport over Streamable HTTP.
 *
 * Every provider that ships a hosted MCP server is reachable with one JSON-RPC
 * `tools/call`; none of the servers we use keeps a session, so no handshake or
 * session id is needed. Adapters own the tool name, argument mapping and headers.
 */

/**
 * Decode one JSON-RPC payload, tolerating both a JSON body and an SSE frame.
 * @param text raw response body
 */
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

/**
 * Call one tool on a remote MCP server and flatten its text blocks.
 *
 * @param input.url endpoint of the MCP server
 * @param input.name remote tool name
 * @param input.args tool arguments
 * @param input.headers extra request headers (authentication, provider tags)
 * @param input.signal caller cancellation
 * @returns the tool's text output
 */
export async function callTool({ url, name, args, headers = {}, signal }) {
  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  })

  const text = await response.text()
  if (response.status === 429) throw new Error('rate limit reached; configure an API key for a higher limit')
  if (!response.ok) throw new Error(`HTTP ${response.status} ${text.slice(0, 200)}`)

  const payload = parsePayload(text)
  if (payload === undefined) throw new Error('empty response')
  if (payload.error !== undefined) {
    throw new Error(payload.error?.message ?? JSON.stringify(payload.error))
  }

  const result = payload.result ?? {}
  const blocks = Array.isArray(result.content) ? result.content : []
  const body = blocks
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n\n')

  if (result.isError === true) throw new Error(body.length > 0 ? body : 'the provider reported an error')
  return body
}
