'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Compass, Layers } from 'lucide-react'
import { readGuestSwipes, type GuestSwipe } from '@/lib/guest-swipes'
import { applySwipe, emptyTally, nicheFromTally, primaryAreaLabel, NICHE_READY_AFTER } from '@/lib/niche-core'
import { NichePanel } from './NichePanel'

/** My niche for visitors who aren't logged in: built from the swipes kept in this browser. */
export function GuestNiche() {
  const [swipes, setSwipes] = useState<GuestSwipe[] | null>(null)
  useEffect(() => setSwipes(readGuestSwipes()), [])
  if (swipes === null) return null

  const niche = nicheFromTally(swipes.reduce((t, s) => applySwipe(t, s), emptyTally()))
  const picks = swipes.filter((s) => s.liked)
  const top = niche.areas.slice(0, 3).map((a) => a.label)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg sm:p-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Compass className="h-4 w-4" /> My niche
        </div>
        {niche.ready ? (
          <>
            <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-4xl">{top[0]}</h1>
            {top.length > 1 && <p className="mt-2 text-lg text-white/80">with a pull towards {top.slice(1).join(' and ')}</p>}
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-4xl">
              {swipes.length === 0 ? 'Swipe to discover your niche' : 'Your niche is still forming'}
            </h1>
            <p className="mt-2 max-w-2xl text-white/80">
              It takes about {NICHE_READY_AFTER} swipes. No account needed: your swipes are kept in this browser.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/swipe" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary-50">
            <Layers className="h-4 w-4" /> {swipes.length ? 'Keep swiping' : 'Start swiping'}
          </Link>
          {swipes.length > 0 && (
            <Link href="/register?next=/niche" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Save my niche <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {swipes.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <NichePanel niche={niche} guest />
          </aside>
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your picks</h2>
              <span className="text-sm text-gray-500">{picks.length} papers</span>
            </div>
            <div className="space-y-2">
              {picks.map((p) => (
                <Link
                  key={p.paperId}
                  href={`/paper/${p.paperId}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-primary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium text-gray-900">{p.title ?? 'Untitled paper'}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{primaryAreaLabel(p.categories)}</span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-primary">Read reviews</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
