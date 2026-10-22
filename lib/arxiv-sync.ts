import { prisma } from './prisma'
import { fetchArxivPapers, arxivPaperToDbFormat } from './arxiv'
import { stringToArray } from './json-helpers'
import { syncPracticeLibrary } from './practice/library-sync'

/**
 * Keeps the paper database stocked from arXiv's public API (no key needed).
 *
 * Each run tops up the categories we hold the fewest papers from, so the deck stays spread
 * across arXiv, which is what the "find your niche" method needs. One extra target searches
 * AI-safety topics. arXiv asks for one request every ~3 seconds, so requests are sequential.
 */

export type SyncTarget = { id: string; category?: string; searchQuery?: string; label: string }

export const SYNC_TARGETS: SyncTarget[] = [
  { id: 'cs.AI', category: 'cs.AI', label: 'Artificial Intelligence' },
  { id: 'cs.CL', category: 'cs.CL', label: 'Computation and Language' },
  { id: 'cs.CV', category: 'cs.CV', label: 'Computer Vision' },
  { id: 'cs.LG', category: 'cs.LG', label: 'Machine Learning' },
  { id: 'cs.RO', category: 'cs.RO', label: 'Robotics' },
  { id: 'cs.CR', category: 'cs.CR', label: 'Cryptography and Security' },
  { id: 'cs.CY', category: 'cs.CY', label: 'Computers and Society' },
  { id: 'cs.HC', category: 'cs.HC', label: 'Human-Computer Interaction' },
  { id: 'cs.IR', category: 'cs.IR', label: 'Information Retrieval' },
  { id: 'cs.NE', category: 'cs.NE', label: 'Neural and Evolutionary Computing' },
  { id: 'stat.ML', category: 'stat.ML', label: 'Statistics: Machine Learning' },
  { id: 'q-bio.NC', category: 'q-bio.NC', label: 'Neurons and Cognition' },
  { id: 'econ.GN', category: 'econ.GN', label: 'General Economics' },
  { id: 'physics.soc-ph', category: 'physics.soc-ph', label: 'Physics and Society' },
  { id: 'math.OC', category: 'math.OC', label: 'Optimization and Control' },
  { id: 'eess.SP', category: 'eess.SP', label: 'Signal Processing' },
  {
    id: 'ai-safety',
    searchQuery: 'abs:"AI safety" OR abs:"AI alignment" OR abs:"reward hacking" OR abs:"mechanistic interpretability"',
    label: 'AI safety',
  },
]

/** Don't re-run within this long of the last import, and treat the data as stale after STALE_MS. */
const MIN_GAP_MS = 60_000
const STALE_MS = 6 * 3600_000
const STOCKED_PAPERS = 100
const ARXIV_DELAY_MS = 3_100

let running: Promise<SyncResult> | null = null

export type SyncResult = {
  skipped?: 'fresh' | 'busy' | 'just-ran'
  added: number
  fetched: number
  targets: string[]
  practiceLinked: number
  errors: string[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Papers per target = how many we already hold whose primary category matches (AI safety: abstract match). */
async function coverage(): Promise<Map<string, number>> {
  const rows = await prisma.paper.findMany({ select: { categories: true }, take: 20000 })
  const counts = new Map<string, number>()
  for (const r of rows) {
    const primary = stringToArray(r.categories)[0]
    if (primary) counts.set(primary, (counts.get(primary) ?? 0) + 1)
  }
  counts.set('ai-safety', await prisma.paper.count({ where: { abstract: { contains: 'AI safety', mode: 'insensitive' } } }))
  return counts
}

export async function syncStatus() {
  const [count, newest, practice] = await Promise.all([
    prisma.paper.count(),
    prisma.paper.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.practiceAbstract.count(),
  ])
  const age = newest ? Date.now() - newest.createdAt.getTime() : Infinity
  return { count, newestAgeMs: age, practice, needed: count < STOCKED_PAPERS || age > STALE_MS || practice < 10 }
}

async function run(opts: { targets: number; perTarget: number; force: boolean }): Promise<SyncResult> {
  const result: SyncResult = { added: 0, fetched: 0, targets: [], practiceLinked: 0, errors: [] }
  const st = await syncStatus()
  if (!opts.force) {
    if (!st.needed) return { ...result, skipped: 'fresh' }
    if (st.newestAgeMs < MIN_GAP_MS && st.count >= STOCKED_PAPERS) return { ...result, skipped: 'just-ran' }
  }

  // 1. top up the least-covered arXiv categories
  const have = await coverage()
  const chosen = [...SYNC_TARGETS].sort((a, b) => (have.get(a.id) ?? 0) - (have.get(b.id) ?? 0)).slice(0, opts.targets)
  for (let i = 0; i < chosen.length; i++) {
    const t = chosen[i]
    if (i > 0) await sleep(ARXIV_DELAY_MS)
    try {
      const papers = await fetchArxivPapers({
        category: t.category ?? '',
        searchQuery: t.searchQuery ?? '',
        maxResults: opts.perTarget,
        sortBy: 'submittedDate',
        sortOrder: 'descending',
      })
      result.fetched += papers.length
      result.targets.push(t.id)
      for (const p of papers) {
        const id = p.id.replace(/v\d+$/, '')
        const exists = await prisma.paper.findFirst({
          where: { OR: [{ arxivId: id }, { arxivId: { startsWith: `${id}v` } }, ...(p.doi ? [{ doi: p.doi }] : [])] },
          select: { id: true },
        })
        if (exists) continue
        const data = arxivPaperToDbFormat(p)
        await prisma.paper.create({
          data: {
            ...data,
            title: data.title.replace(/\s+/g, ' ').trim(),
            abstract: data.abstract.replace(/\s+/g, ' ').trim(),
            doi: data.doi ?? undefined,
          },
        })
        result.added++
      }
    } catch (err: any) {
      result.errors.push(`${t.id}: ${err?.message ?? 'failed'}`)
    }
  }

  // 2. make sure the practice library exists (one request for all of them)
  if (st.practice < 10) {
    try {
      if (chosen.length) await sleep(ARXIV_DELAY_MS)
      result.practiceLinked = await syncPracticeLibrary(prisma)
    } catch (err: any) {
      result.errors.push(`practice: ${err?.message ?? 'failed'}`)
    }
  }
  return result
}

/** Runs one sync. Only one run at a time per server instance; concurrent callers get `busy`. */
export async function syncArxiv(opts: { targets?: number; perTarget?: number; force?: boolean } = {}): Promise<SyncResult> {
  if (running) return { skipped: 'busy', added: 0, fetched: 0, targets: [], practiceLinked: 0, errors: [] }
  running = run({ targets: opts.targets ?? 3, perTarget: opts.perTarget ?? 12, force: opts.force ?? false })
  try {
    return await running
  } finally {
    running = null
  }
}
