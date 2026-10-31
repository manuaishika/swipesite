import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { fieldOf } from '@/lib/niche-core'
import { ALL_TARGET, CATEGORY_TARGETS, currentPeriod, growth, last12, readStats } from '@/lib/research-stats'
import { LandscapeNav } from '@/components/landscape/LandscapeNav'
import { StatsRefresher } from '@/components/landscape/StatsRefresher'
import { LandscapeView, type Area } from '@/components/landscape/LandscapeView'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Research landscape', description: 'Which research areas are biggest and growing fastest, from arXiv submissions.' }

const DAY = 86400_000

export default async function LandscapePage() {
  let areas: Area[] = []
  let total: number | null = null
  let window = ''
  let stale = 0
  try {
    const stats = await readStats([ALL_TARGET.key, ...CATEGORY_TARGETS.map((t) => t.key)])
    const all = stats.get(ALL_TARGET.key)?.data
    total = last12(all)
    // How many people here have rated papers in each area lately (the "who's looking now" signal).
    const likes = await prisma.paperLike.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 90 * DAY) } },
      select: { userId: true, paper: { select: { categories: true } } },
      take: 50000,
    })
    const people = new Map<string, Set<string>>()
    for (const l of likes) {
      const c = stringToArray(l.paper.categories)[0]
      if (!c) continue
      if (!people.has(c)) people.set(c, new Set())
      people.get(c)!.add(l.userId)
    }
    areas = CATEGORY_TARGETS.map((t) => {
      const code = t.key.slice(4)
      const d = stats.get(t.key)?.data ?? null
      if (d && !window) window = d.windows[0].label
      return { code, name: t.label, field: fieldOf(code).label, papers: last12(d), prev: d?.windows[1]?.count ?? null, growth: growth(d), people: people.get(code)?.size ?? 0 }
    })
    // the same name in two archives (cs.LG and stat.ML are both "Machine Learning"): add the code
    const seen = new Map<string, number>()
    for (const a of areas) seen.set(a.name, (seen.get(a.name) ?? 0) + 1)
    areas = areas.map((a) => (seen.get(a.name)! > 1 ? { ...a, name: `${a.name} (${a.code})` } : a))
    const period = currentPeriod()
    stale = [ALL_TARGET, ...CATEGORY_TARGETS].filter((t) => stats.get(t.key)?.data?.period !== period).length
  } catch (err) {
    console.error('[landscape] load failed:', err)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <LandscapeNav
        active="/landscape"
        title="Research landscape"
        sub="Where the research is happening: papers submitted to arXiv in the last 12 months, by area, and how fast each area is growing."
      />
      <StatsRefresher body={{ scope: 'landscape' }} stale={stale} total={CATEGORY_TARGETS.length + 1} />
      <LandscapeView areas={areas} total={total} window={window} />
    </div>
  )
}
