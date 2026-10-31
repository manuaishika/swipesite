/**
 * Fast checks of pure logic (no database). Run: npm run test:unit
 */
import assert from 'node:assert/strict'
import { applySwipe, emptyTally, nicheFromTally, wilson } from '../lib/niche-core'
import { eventEnd, eventStart, firstDeadline, nextEdition } from '../lib/event-dates'
import { buildIcs } from '../lib/ics'
import { CONFERENCES } from '../lib/conferences'
import { parseArxivId } from '../lib/arxiv-id'
import { squarify } from '../lib/treemap'
import { monthWindows, nicheLevel, topicQuery } from '../lib/research-stats'
import { BACKGROUNDS, bridgeTarget } from '../lib/bridges'
import { EDGES, NODES } from '../lib/paths'

let passed = 0
const test = (name: string, fn: () => void) => {
  fn()
  passed++
  console.log(`  ok  ${name}`)
}

test('wilson interval contains the rate and narrows with more data', () => {
  const small = wilson(3, 5)
  const big = wilson(60, 100)
  assert.ok(small.low < 0.6 && small.high > 0.6)
  assert.ok(big.high - big.low < small.high - small.low)
})

test('niche: no conclusion from a handful of ratings', () => {
  let t = emptyTally()
  for (let i = 0; i < 5; i++) t = applySwipe(t, { liked: true, categories: ['cs.LG'], keywords: [] })
  const n = nicheFromTally(t)
  assert.equal(n.stage, 'explore')
  assert.equal(n.likely.length, 0)
})

test('niche: a clearly preferred category becomes likely after enough evidence', () => {
  let t = emptyTally()
  const cats = ['cs.LG', 'cs.CV', 'cs.CL', 'math.ST', 'q-bio.NC']
  for (let r = 0; r < 8; r++) for (const c of cats) t = applySwipe(t, { liked: c === 'cs.CL', categories: [c], keywords: ['language'] })
  const n = nicheFromTally(t)
  assert.equal(n.stage, 'focus')
  assert.deepEqual(n.likely.map((c) => c.code), ['cs.CL'])
})

test('niche: undo (sign -1) reverses a swipe exactly', () => {
  const s = { liked: true, categories: ['cs.AI'], keywords: ['agents'] }
  const t = applySwipe(applySwipe(emptyTally(), s), s, -1)
  assert.equal(t.swipes, 0)
  assert.equal(t.cats['cs.AI'].likes, 0)
})

test('event dates: ranges, cross-month, month-only and deadlines', () => {
  assert.equal(eventEnd('Dec 6-12, 2026')?.getDate(), 12)
  assert.equal(eventEnd('Feb 22-Mar 2, 2027')?.getMonth(), 2)
  assert.equal(eventStart('Mar 2027')?.getDate(), 1)
  assert.equal(eventEnd('Mar 2027')?.getDate(), 31)
  assert.equal(firstDeadline('Sep 28, 2026 (Oct 5, 2026)')?.getDate(), 28)
  assert.equal(firstDeadline('Sep-Oct 2026'), null)
})

test('event dates: next edition, yearly and biennial', () => {
  const list = [
    { name: 'FooConf 2026', when: 'Jun 1-3, 2026' },
    { name: 'ECCV 2026', when: 'Sep 6-12, 2026' },
  ]
  assert.deepEqual(nextEdition(list[0], list), { expected: 'June 2027' })
  assert.deepEqual(nextEdition(list[1], list), { expected: 'September 2028' })
})

test('conference list: every entry parses and names are unique', () => {
  const names = new Set<string>()
  for (const c of CONFERENCES) {
    assert.ok(eventEnd(c.when), `unparseable date: ${c.name} "${c.when}"`)
    assert.ok(!names.has(c.name), `duplicate: ${c.name}`)
    names.add(c.name)
    assert.match(c.url, /^https?:\/\//)
  }
})

test('ics: all-day event ends the day after its last day', () => {
  const ics = buildIcs([{ uid: 'x', title: 'Conf; with, chars', start: new Date(2027, 0, 30), end: new Date(2027, 1, 2) }])
  assert.match(ics, /DTSTART;VALUE=DATE:20270130/)
  assert.match(ics, /DTEND;VALUE=DATE:20270203/)
  assert.ok(ics.includes('SUMMARY:Conf\\; with\\, chars'))
})

test('arXiv id from pasted links', () => {
  assert.equal(parseArxivId('https://arxiv.org/abs/2401.05566v3'), '2401.05566')
  assert.equal(parseArxivId('https://arxiv.org/pdf/2401.05566.pdf'), '2401.05566')
  assert.equal(parseArxivId('arXiv:2401.05566'), '2401.05566')
  assert.equal(parseArxivId(' 1706.03762 '), '1706.03762')
  assert.equal(parseArxivId('https://arxiv.org/abs/hep-th/9901001v1'), 'hep-th/9901001')
  assert.equal(parseArxivId('hello world'), null)
})

test('treemap: tiles fill the box and areas match the values', () => {
  const items = [6, 6, 4, 3, 2, 2, 1]
  const tiles = squarify(items, (v) => v, { x: 0, y: 0, w: 600, h: 400 })
  assert.equal(tiles.length, items.length)
  const total = tiles.reduce((s, t) => s + t.w * t.h, 0)
  assert.ok(Math.abs(total - 600 * 400) < 1e-6)
  for (const t of tiles) {
    assert.ok(Math.abs((t.w * t.h) / (600 * 400) - t.item / 24) < 1e-9)
    assert.ok(t.x >= -1e-9 && t.y >= -1e-9 && t.x + t.w <= 600 + 1e-6 && t.y + t.h <= 400 + 1e-6)
  }
  assert.equal(squarify([0, 0], (v) => v, { x: 0, y: 0, w: 10, h: 10 }).length, 0)
})

test('research stats: 12-month windows end at the start of this month', () => {
  const w = monthWindows(2, new Date(Date.UTC(2026, 9, 31)))
  assert.equal(w[0].to.toISOString().slice(0, 10), '2026-10-01')
  assert.equal(w[0].from.toISOString().slice(0, 10), '2025-10-01')
  assert.equal(w[1].to.toISOString().slice(0, 10), '2025-10-01')
  assert.equal(w[0].label, 'Oct 2025 – Sep 2026')
})

test('research stats: topic input becomes a safe arXiv query', () => {
  assert.equal(topicQuery('Mechanistic Interpretability')?.query, 'all:"mechanistic interpretability"')
  assert.equal(topicQuery('labor market + artificial intelligence')?.query, 'all:"labor market" AND all:"artificial intelligence"')
  assert.equal(topicQuery('transformers')?.query, 'all:transformers')
  assert.equal(topicQuery('x') , null)
  assert.ok(!topicQuery('a") OR cat:cs.* OR ("b')!.query.includes(')'))
  assert.equal(nicheLevel(10).label, 'Very niche')
  assert.equal(nicheLevel(5000).label, 'Major area')
})

test('bridges and paths: every bridge has a valid query, every edge real nodes', () => {
  const ids = new Set<string>()
  for (const bg of BACKGROUNDS) {
    for (const br of bg.bridges) {
      assert.ok(!ids.has(br.id), `duplicate bridge ${br.id}`)
      ids.add(br.id)
      assert.ok(bridgeTarget(br).query.startsWith('all:'), br.id)
      assert.ok(br.cats.length > 0 && br.enjoy.length > 0, br.id)
    }
  }
  const nodes = new Set(NODES.map((n) => n.id))
  for (const e of EDGES) assert.ok(nodes.has(e.from) && nodes.has(e.to), `${e.from}->${e.to}`)
})

console.log(`\n${passed} unit checks passed`)
