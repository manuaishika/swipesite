import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { areaLabel } from '@/lib/niche-core'
import { AREA_PREFIX, isTrackId, loadTrack } from '@/lib/quest/tracks'
import { trackById } from '@/lib/quest/bank'
import { QuestPath } from '@/components/quest/QuestPath'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { track: string } }): Promise<Metadata> {
  const id = decodeURIComponent(params.track)
  return { title: `${trackById(id)?.name ?? areaLabel(id.slice(AREA_PREFIX.length))} quest` }
}

export default async function TrackPage({ params, searchParams }: { params: { track: string }; searchParams: { placement?: string } }) {
  const id = decodeURIComponent(params.track)
  if (!isTrackId(id)) notFound()
  const track = await loadTrack(id)
  if (!track) {
    // a generated track needs enough real abstracts in the area first
    const code = id.slice(AREA_PREFIX.length)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-4xl" aria-hidden>📚</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">{areaLabel(code)} quest is almost ready</h1>
        <p className="mt-2 text-gray-600">Its lessons are built from real abstracts in this area, and we don&apos;t have enough yet. Rating a few brings them in.</p>
        <Link href={`/swipe?focus=${encodeURIComponent(code)}&label=${encodeURIComponent(areaLabel(code))}`} className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          Rate abstracts in {areaLabel(code)}
        </Link>
      </div>
    )
  }
  const pl = Number(searchParams.placement)
  return <QuestPath track={track} placement={[0, 1, 2].includes(pl) ? pl : null} />
}
