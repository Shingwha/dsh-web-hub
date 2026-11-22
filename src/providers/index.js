/**
 * The provider registry: the one place that decides which sources exist on the
 * Host side. Adding a source means adding its module and one line here.
 */

import anysearch from './anysearch.js'
import exa from './exa.js'
import firecrawl from './firecrawl.js'
import tavily from './tavily.js'
import yuanbao from './yuanbao.js'

export const providers = {
  [anysearch.id]: anysearch,
  [exa.id]: exa,
  [firecrawl.id]: firecrawl,
  [tavily.id]: tavily,
  [yuanbao.id]: yuanbao,
}

/**
 * Public tool name of one provider tool, and the switch that mounts it.
 * @param provider provider spec
 * @param key tool key within that provider
 */
export function publicName(provider, key) {
  return `${provider.id}_${key}`
}
