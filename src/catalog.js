/**
 * What the Web client needs to know about each tool, derived from the provider
 * registry so a tool is declared exactly once.
 *
 * The client cannot import Host modules, so `scripts/sync-client-catalog.mjs`
 * writes this projection into `client.js`; `npm run check` fails when the two
 * drift apart.
 */

import { providers, publicName } from './providers/index.js'

/**
 * @returns {{
 *   tools: Record<string, { card?: 'search' | 'fetch', needsKey?: boolean }>,
 *   hosts: Record<string, string | undefined>,
 * }}
 */
export function catalog() {
  const tools = {}
  const hosts = {}
  for (const provider of Object.values(providers)) {
    hosts[provider.id] = provider.host
    for (const [key, tool] of Object.entries(provider.tools)) {
      const entry = {}
      if (tool.card !== undefined) entry.card = tool.card
      if (tool.needsKey === true) entry.needsKey = true
      tools[publicName(provider, key)] = entry
    }
  }
  return { tools, hosts }
}
