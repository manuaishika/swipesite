import type { Metadata } from 'next'
import { getSafeServerSession } from '@/lib/safe-session'
import { getNiche } from '@/lib/niche'
import { CATEGORY_CODES, areaLabel } from '@/lib/niche-core'
import { TRACKS } from '@/lib/quest/bank'
import { QuestHub } from '@/components/quest/QuestHub'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Quests', description: 'Level up in your research niche: short lessons, placement tests, streaks and milestones.' }

export default async function QuestHubPage() {
  const session = await getSafeServerSession()
  const niche = session ? await getNiche(session.user.id).catch(() => null) : null
  return (
    <QuestHub
      tracks={TRACKS.map((t) => ({ id: t.id, name: t.name, emoji: t.emoji, codes: t.codes, lessons: t.levels.flatMap((l) => l.lessons.map((x) => x.id)) }))}
      areas={CATEGORY_CODES.map((c) => ({ code: c, name: areaLabel(c) }))}
      serverNiche={niche ? niche.likely.map((c) => ({ code: c.code, name: c.name })) : null}
    />
  )
}
