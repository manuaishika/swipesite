import type { Metadata } from 'next'
import { BACKGROUNDS, backgroundById, bridgeTarget, bridgeTopic } from '@/lib/bridges'
import { currentPeriod, growth, last12, readStats } from '@/lib/research-stats'
import { LandscapeNav } from '@/components/landscape/LandscapeNav'
import { StatsRefresher } from '@/components/landscape/StatsRefresher'
import { BridgeMap, type BridgeView } from '@/components/landscape/BridgeMap'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'From another field', description: 'Where economics, biology, physics, law and other fields meet machine learning and AI safety.' }

export default async function BridgesPage({ searchParams }: { searchParams: { from?: string } }) {
  const bg = backgroundById(searchParams.from)
  let bridges: BridgeView[] = []
  let stale = 0
  if (bg) {
    const targets = bg.bridges.map(bridgeTarget)
    const stats = await readStats(targets.map((t) => t.key)).catch(() => new Map())
    bridges = bg.bridges.map((br, i) => {
      const d = stats.get(targets[i].key)?.data ?? null
      return { ...br, topic: bridgeTopic(br), papers: last12(d), growth: growth(d) }
    })
    stale = targets.filter((t) => stats.get(t.key)?.data?.period !== currentPeriod()).length
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <LandscapeNav
        active="/landscape/bridges"
        title="From another field"
        sub="Coming from outside computer science? Pick your background to see where it meets machine learning and AI safety, and how big each crossover is."
      />
      {bg && <StatsRefresher key={bg.id} body={{ scope: 'bridges', background: bg.id }} stale={stale} total={bg.bridges.length} noun="crossovers" />}
      <BridgeMap backgrounds={BACKGROUNDS.map(({ id, label, emoji }) => ({ id, label, emoji }))} active={bg ? { id: bg.id, label: bg.label, emoji: bg.emoji } : null} bridges={bridges} />
    </div>
  )
}
