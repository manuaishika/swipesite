/**
 * How big is a research area, and is it growing? Counted with arXiv's own search API.
 *
 * arXiv returns the number of matching papers (opensearch:totalResults) even with max_results=0,
 * so one request gives one count. We count papers submitted in rolling 12-month windows that end
 * at the start of the current month, cache them in ResearchStat, and refresh once a month.
 * Requests are sequential, ~3 s apart, as arXiv asks, and only one refresh runs at a time across
 * all servers (a short database lease).
 */
import { prisma } from '@/lib/prisma'
import { ARXIV_API, fetchArxivPapers } from '@/lib/arxiv'
import { areaLabel, CATEGORY_CODES } from '@/lib/niche-core'

export const ARXIV_DELAY_MS = 3100
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type StatKind = 'category' | 'bridge' | 'topic' | 'all'
export type StatTarget = { key: string; kind: StatKind; label: string; query: string; windows: number; sample?: boolean }
export type CountWindow = { label: string; from: string; to: string; count: number }
export type StatData = {
  period: string // "2026-10": the month the windows end at
  windows: CountWindow[] // newest first
  sample?: { size: number; authors: number; where: { code: string; n: number }[] }
}

// ------------------------------------------------------------------ time windows

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function currentPeriod(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

/** n back-to-back 12-month windows, newest first, ending at the start of the current month (UTC). */
export function monthWindows(n: number, now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  return Array.from({ length: n }, (_, i) => {
    const to = new Date(Date.UTC(end.getUTCFullYear() - i, end.getUTCMonth(), 1))
    const from = new Date(Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth(), 1))
    const last = new Date(to.getTime() - 86400_000)
    return {
      from,
      to,
      label: `${MONTHS[from.getUTCMonth()]} ${from.getUTCFullYear()} – ${MONTHS[last.getUTCMonth()]} ${last.getUTCFullYear()}`,
    }
  })
}

const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}0000`

// ------------------------------------------------------------------ arXiv

/** Number of arXiv papers matching `query` submitted in [from, to). Empty query = all of arXiv. */
export async function countArxiv(query: string, from: Date, to: Date): Promise<number> {
  const range = `submittedDate:[${stamp(from)} TO ${stamp(new Date(to.getTime() - 60_000))}]`
  const search = query ? `(${query}) AND ${range}` : range
  const url = `${ARXIV_API}?${new URLSearchParams({ search_query: search, start: '0', max_results: '0' })}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`arXiv ${res.status}`)
  const m = (await res.text()).match(/<opensearch:totalResults[^>]*>(\d+)<\/opensearch:totalResults>/)
  if (!m) throw new Error('arXiv response had no total')
  return Number(m[1])
}

// ------------------------------------------------------------------ targets

export const categoryTarget = (code: string): StatTarget => ({
  key: `cat:${code}`,
  kind: 'category',
  label: areaLabel(code),
  query: `cat:${code}`,
  windows: 2,
})

export const ALL_TARGET: StatTarget = { key: 'all', kind: 'all', label: 'All of arXiv', query: '', windows: 2 }

export const CATEGORY_TARGETS = CATEGORY_CODES.map(categoryTarget)

/**
 * Turns what someone types into an arXiv query. "a + b" means both phrases must appear.
 * Only letters, digits, spaces and hyphens survive, so the query can't be tampered with.
 */
export function topicQuery(input: string): { key: string; label: string; query: string } | null {
  const terms = input
    .split('+')
    .map((t) => t.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter((t) => t.length >= 2)
    .slice(0, 3)
  if (!terms.length || terms.join(' ').length > 80) return null
  const query = terms.map((t) => (t.includes(' ') || t.includes('-') ? `all:"${t}"` : `all:${t}`)).join(' AND ')
  const label = terms.join(' + ')
  return { key: `topic:${label}`, label, query }
}

export const topicTarget = (input: string): StatTarget | null => {
  const t = topicQuery(input)
  return t ? { ...t, kind: 'topic', windows: 5, sample: true } : null
}

// ------------------------------------------------------------------ cache

export function parseData(raw: string | null | undefined): StatData | null {
  try {
    const d = JSON.parse(raw || '{}')
    return Array.isArray(d.windows) && d.windows.length ? (d as StatData) : null
  } catch {
    return null
  }
}

export async function readStats(keys: string[]) {
  const rows = await prisma.researchStat.findMany({ where: { key: { in: keys } } })
  return new Map(rows.map((r) => [r.key, { label: r.label, data: parseData(r.data), updatedAt: r.updatedAt }]))
}

const isFresh = (d: StatData | null, t: StatTarget) => Boolean(d && d.period === currentPeriod() && d.windows.length >= t.windows)

/** Which targets still need counting this month. */
export async function staleTargets(targets: StatTarget[]) {
  const have = await readStats(targets.map((t) => t.key))
  return targets.filter((t) => !isFresh(have.get(t.key)?.data ?? null, t))
}

// One refresh at a time across all instances: a lease row that expires after 75 s.
const LEASE_MS = 75_000
async function takeLease(): Promise<boolean> {
  const cutoff = new Date(Date.now() - LEASE_MS)
  const got = await prisma.researchStat.updateMany({ where: { key: '_lease', updatedAt: { lt: cutoff } }, data: { data: String(Date.now()) } })
  if (got.count) return true
  try {
    await prisma.researchStat.create({ data: { key: '_lease', kind: 'lease', label: 'refresh lease', data: String(Date.now()) } })
    return true
  } catch {
    return false // someone else holds it
  }
}
async function releaseLease() {
  // remember when the last arXiv request went out, so the next run keeps the 3 s spacing
  await prisma.researchStat
    .upsert({ where: { key: '_last' }, create: { key: '_last', kind: 'lease', label: 'last arXiv request', data: String(Date.now()) }, update: { data: String(Date.now()) } })
    .catch(() => {})
  await prisma.researchStat.updateMany({ where: { key: '_lease' }, data: { data: '0', updatedAt: new Date(0) } }).catch(() => {})
}
async function waitForSpacing() {
  const last = await prisma.researchStat.findUnique({ where: { key: '_last' } }).catch(() => null)
  const since = Date.now() - Number(last?.data ?? 0)
  if (since < ARXIV_DELAY_MS) await sleep(ARXIV_DELAY_MS - since)
}

async function computeOne(t: StatTarget): Promise<StatData> {
  const wins = monthWindows(t.windows)
  const windows: CountWindow[] = []
  for (let i = 0; i < wins.length; i++) {
    if (i) await sleep(ARXIV_DELAY_MS)
    const w = wins[i]
    windows.push({ label: w.label, from: w.from.toISOString(), to: w.to.toISOString(), count: await countArxiv(t.query, w.from, w.to) })
  }
  const data: StatData = { period: currentPeriod(), windows }
  if (t.sample) {
    await sleep(ARXIV_DELAY_MS)
    // The 100 most recent papers: where they're filed and how many different people wrote them.
    const recent = await fetchArxivPapers({ searchQuery: t.query, maxResults: 100, sortBy: 'submittedDate', sortOrder: 'descending' })
    const where = new Map<string, number>()
    const authors = new Set<string>()
    for (const p of recent) {
      const primary = p.categories[0]
      if (primary) where.set(primary, (where.get(primary) ?? 0) + 1)
      for (const a of p.authors) authors.add(a.toLowerCase())
    }
    data.sample = {
      size: recent.length,
      authors: authors.size,
      where: Array.from(where.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([code, n]) => ({ code, n })),
    }
  }
  return data
}

export type RefreshResult = { busy?: boolean; updated: string[]; remaining: number; errors: string[] }

/**
 * Counts stale targets until the time budget runs out (keep it under the function's maxDuration).
 * Returns what was updated and how many are still stale.
 */
export async function refreshStats(targets: StatTarget[], budgetMs = 40_000): Promise<RefreshResult> {
  const stale = await staleTargets(targets)
  if (!stale.length) return { updated: [], remaining: 0, errors: [] }
  if (!(await takeLease())) return { busy: true, updated: [], remaining: stale.length, errors: [] }
  await waitForSpacing()
  const started = Date.now()
  const updated: string[] = []
  const errors: string[] = []
  try {
    for (const t of stale) {
      const cost = (t.windows + (t.sample ? 1 : 0)) * ARXIV_DELAY_MS
      if (updated.length && Date.now() - started + cost > budgetMs) break
      if (updated.length || errors.length) await sleep(ARXIV_DELAY_MS)
      try {
        const data = await computeOne(t)
        await prisma.researchStat.upsert({
          where: { key: t.key },
          create: { key: t.key, kind: t.kind, label: t.label, data: JSON.stringify(data) },
          update: { label: t.label, data: JSON.stringify(data) },
        })
        updated.push(t.key)
      } catch (err: any) {
        errors.push(`${t.key}: ${err?.message ?? 'failed'}`)
        if (errors.length >= 2) break // arXiv is probably down; try again later
      }
    }
  } finally {
    await releaseLease()
  }
  return { updated, remaining: stale.length - updated.length, errors }
}

// ------------------------------------------------------------------ reading helpers

export const last12 = (d: StatData | null | undefined) => d?.windows[0]?.count ?? null
export function growth(d: StatData | null | undefined): number | null {
  const [a, b] = [d?.windows[0]?.count, d?.windows[1]?.count]
  return a !== undefined && b ? (a - b) / b : null
}

/** How niche is it, by papers in the last 12 months. */
export function nicheLevel(n: number): { label: string; detail: string; step: 0 | 1 | 2 | 3 } {
  if (n < 30) return { label: 'Very niche', detail: 'A handful of papers a year. Room to own a topic.', step: 0 }
  if (n < 300) return { label: 'Niche', detail: 'A small community. You can read most of it.', step: 1 }
  if (n < 3000) return { label: 'Established', detail: 'An active area with its own venues and debates.', step: 2 }
  return { label: 'Major area', detail: 'Huge and fast-moving. You will need a sub-niche.', step: 3 }
}
