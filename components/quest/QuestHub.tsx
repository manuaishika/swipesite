'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Flame, Sparkles, Star } from 'lucide-react'
import { readGuestSwipes } from '@/lib/guest-swipes'
import { applySwipe, emptyTally, nicheFromTally } from '@/lib/niche-core'
import { PASS } from '@/lib/quest/engine'
import { trackIdFor } from '@/lib/quest/ids'
import { PhysicsCard, Stagger, StaggerItem } from '@/components/motion/Physics'
import { useQuest } from './useQuest'

type T = { id: string; name: string; emoji: string; codes: string[]; lessons: string[] }

export function QuestHub({ tracks, areas, serverNiche }: { tracks: T[]; areas: { code: string; name: string }[]; serverNiche: { code: string; name: string }[] | null }) {
  const q = useQuest()
  const router = useRouter()
  const [niche, setNiche] = useState(serverNiche)
  useEffect(() => {
    if (serverNiche) return
    const t = readGuestSwipes().reduce((acc, s) => applySwipe(acc, s), emptyTally())
    setNiche(nicheFromTally(t).likely.map((c) => ({ code: c.code, name: c.name })))
  }, [serverNiche])

  const mine = (niche ?? []).slice(0, 2).map((c) => ({ ...c, track: trackIdFor(c.code) }))
  const pct = (t: T) => Math.round((t.lessons.filter((id) => (q.progress(t.id).lessons[id] ?? 0) >= PASS).length / t.lessons.length) * 100)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Quests</h1>
          <p className="mt-1 max-w-xl text-gray-600">Short lessons on what people in each area are expected to know. Three levels, a placement test, streaks and milestones.</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 ring-1 ring-amber-200"><Star className="h-4 w-4" /> {q.stats.xp} XP</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-900 ring-1 ring-orange-200"><Flame className="h-4 w-4" /> {q.stats.streak} day{q.stats.streak === 1 ? '' : 's'}</span>
        </div>
      </div>

      {mine.length > 0 ? (
        <section className="mt-6 rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg">
          <p className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-white/75"><Sparkles className="h-4 w-4" /> From your niche</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {mine.map((m) => (
              <motion.div key={m.code} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
                <Link href={`/quest/${m.track}`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-primary shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
                  {m.name} <span className="text-sm font-normal text-gray-500">→ start</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-3xl border-2 border-dashed border-gray-300 bg-white/60 p-6 text-center">
          <p className="font-medium text-gray-900">Your niche isn&apos;t clear yet</p>
          <p className="mt-1 text-sm text-gray-600">Keep rating abstracts; when one area stands out, its quest appears here. Or pick any track below.</p>
          <Link href="/swipe" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">Rate abstracts</Link>
        </section>
      )}

      <h2 className="mt-10 text-lg font-semibold text-gray-900">All tracks</h2>
      <Stagger className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
        {tracks.map((t) => (
          <StaggerItem key={t.id}>
            <PhysicsCard href={`/quest/${t.id}`} className="block h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" tilt={10}>
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>{t.emoji}</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.codes.join(' · ')}</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400" style={{ width: `${Math.max(2, pct(t))}%` }} />
              </div>
              <p className="mt-1 text-xs text-gray-500">{pct(t)}% · {t.lessons.length} lessons</p>
            </PhysicsCard>
          </StaggerItem>
        ))}
      </Stagger>

      <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="font-medium text-gray-900">Any other arXiv area</h2>
        <p className="mt-0.5 text-sm text-gray-600">Lessons built from real abstracts in that area: can you tell which paper an abstract belongs to?</p>
        <select
          aria-label="Area"
          defaultValue=""
          onChange={(e) => e.target.value && router.push(`/quest/area-${e.target.value}`)}
          className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm sm:w-80"
        >
          <option value="" disabled>Pick an area…</option>
          {areas.map((a) => (
            <option key={a.code} value={a.code}>{a.name} ({a.code})</option>
          ))}
        </select>
      </section>
    </div>
  )
}
