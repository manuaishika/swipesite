'use client'

import { useEffect, useState } from 'react'
import { readGuestSwipes, type GuestSwipe } from '@/lib/guest-swipes'
import { applySwipe, emptyTally, nicheFromTally } from '@/lib/niche-core'
import { NicheReport } from './NicheReport'

/** My niche for visitors who aren't logged in: the same analysis, from the ratings kept in this browser. */
export function GuestNiche() {
  const [swipes, setSwipes] = useState<GuestSwipe[] | null>(null)
  useEffect(() => setSwipes(readGuestSwipes()), [])
  if (swipes === null) return null

  const niche = nicheFromTally(swipes.reduce((t, s) => applySwipe(t, s), emptyTally()))
  const picks = swipes
    .filter((s) => s.liked)
    .map((s) => ({ id: s.paperId, title: s.title ?? 'Untitled paper', categories: s.categories }))
  return <NicheReport niche={niche} picks={picks} guest />
}
