#!/usr/bin/env node
/**
 * Write the tool catalog into `client.js`.
 *
 * The Web client cannot import Host modules, so the facts it needs — which tool
 * renders with which card, and which tools only answer with a key — are copied
 * in from `src/providers` here. Run with `--check` to fail when the copy is
 * stale instead of rewriting it.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { catalog } from '../src/catalog.js'

const CLIENT = fileURLToPath(new URL('../client.js', import.meta.url))
const START = '    // <generated:catalog>'
const END = '    // </generated:catalog>'

/**
 * Render the generated block from the provider registry.
 * @returns the block, markers included
 */
function render() {
  const { tools, hosts } = catalog()
  const names = Object.keys(tools).sort()
  const withCard = kind => names.filter(name => tools[name].card === kind)
  const keyOnly = names.filter(name => tools[name].needsKey === true)

  return [
    START,
    '    /** Generated from src/providers by scripts/sync-client-catalog.mjs; do not edit. */',
    '    const CARD_KINDS = {',
    ...withCard('search').map(name => `      ${name}: 'search',`),
    ...withCard('fetch').map(name => `      ${name}: 'fetch',`),
    '    }',
    '',
    '    /** Tools that only answer with a provider key; the panel says so while it is unset. */',
    `    const KEY_ONLY = new Set([${keyOnly.map(name => `'${name}'`).join(', ')}])`,
    '',
    '    /** Home host of each provider, whose mark a row falls back to. */',
    '    const PROVIDER_HOSTS = {',
    ...Object.entries(hosts).map(([id, host]) => `      ${id}: '${host}',`),
    '    }',
    END,
  ].join('\n')
}

/** Replace the marked block, leaving every other byte of the client untouched. */
function splice(source, block) {
  const start = source.indexOf(START)
  const end = source.indexOf(END)
  if (start === -1 || end === -1) {
    throw new Error('client.js has no generated catalog block; add the markers first')
  }
  return source.slice(0, start) + block + source.slice(end + END.length)
}

const source = await readFile(CLIENT, 'utf8')
const block = render()
const next = splice(source, block)
const stale = next !== source

if (process.argv.includes('--check')) {
  if (stale) {
    console.error('client.js catalog is stale; run `npm run sync`')
    process.exit(1)
  }
  console.log('client.js catalog is current')
} else if (stale) {
  await writeFile(CLIENT, next)
  console.log('client.js catalog updated')
} else {
  console.log('client.js catalog already current')
}
