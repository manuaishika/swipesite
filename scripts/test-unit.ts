/**
 * Fast checks of pure logic (no database). Run: npm run test:unit
 */
import assert from 'node:assert/strict'
import { applySwipe, emptyTally, nicheFromTally, wilson } from '../lib/niche-core'
import { eventEnd, eventStart, firstDeadline, nextEdition } from '../lib/event-dates'
import { buildIcs } from '../lib/ics'
import { CONFERENCES } from '../lib/conferences'
import { parseArxivId } from '../lib/arxiv-id'

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

console.log(`\n${passed} unit checks passed`)
