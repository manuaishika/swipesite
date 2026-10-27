import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { getPublicMap } from '@/lib/public-map'
import { EvidenceRow, StageStepper } from '@/components/swipe/NichePanel'

export const dynamic = 'force-dynamic'

const pct = (x: number) => `${Math.round(x * 100)}%`

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const map = await getPublicMap(params.username).catch(() => null)
  if (!map) return { title: 'Research map' }
  const name = map.user.name || map.user.username
  const top = (map.niche.likely.length ? map.niche.likely : map.niche.categories).slice(0, 2).map((c) => c.name)
  return {
    title: `${name}'s research map`,
    description: top.length ? `${name} is drawn to ${top.join(' and ')}. Find your own research niche from real arXiv abstracts.` : `Find your own research niche from real arXiv abstracts.`,
  }
}

export default async function PublicMapPage({ params }: { params: { username: string } }) {
  const map = await getPublicMap(params.username).catch(() => null)
  if (!map) notFound()
  const { user, niche } = map
  const name = user.name || user.username
  const rows = niche.categories.slice(0, 8)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <section className="rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm text-white/70">Research map</p>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-semibold sm:text-3xl">
          {name}
          {(user.role === 'expert' || user.role === 'admin') && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium">
              <BadgeCheck className="h-3.5 w-3.5" /> {user.expertise || 'Expert'}
            </span>
          )}
        </h1>
        <div className="mt-5 max-w-md"><StageStepper niche={niche} onDark /></div>
        <p className="mt-4 leading-relaxed text-white/85">
          {niche.likely.length
            ? `Strongest evidence: ${niche.likely.slice(0, 3).map((c) => c.name).join(', ')}.`
            : niche.swipes
              ? 'Still exploring. No category is clearly above average yet.'
              : 'Hasn’t rated any abstracts yet.'}
        </p>
        {niche.swipes > 0 && (
          <p className="mt-2 text-sm text-white/70">
            {niche.swipes} abstracts rated · {niche.categories.length} arXiv categories · {pct(niche.baseRate)} marked interesting
          </p>
        )}
      </section>

      {rows.length > 0 && (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold text-gray-900">By arXiv category</h2>
            <span className="text-xs text-gray-500">line = their average</span>
          </div>
          <ul className="space-y-3.5">
            {rows.map((c) => (
              <EvidenceRow key={c.code} c={c} baseRate={niche.baseRate} />
            ))}
          </ul>
          {niche.fields.length > 0 && (
            <p className="mt-4 text-xs text-gray-500">Fields: {niche.fields.map((f) => f.label).join(' · ')}</p>
          )}
        </section>
      )}

      {niche.topics.length > 0 && (
        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900">Recurring topics</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {niche.topics.slice(0, 12).map((k) => (
              <span key={k.term} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">{k.term}</span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-primary/20 bg-primary-50 p-6 text-center">
        <p className="font-semibold text-gray-900">What would your map look like?</p>
        <p className="mt-1 text-sm text-gray-600">Rate real arXiv abstracts. No account needed to start.</p>
        <Link href="/swipe" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light">
          Find my niche <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
