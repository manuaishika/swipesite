'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronsRight, Flame, Lock, Star, Trophy } from 'lucide-react'
import type { Track } from '@/lib/quest/bank'
import { BADGES, PASS, lessonStates, levelDone, seededShuffle, type TrackShape } from '@/lib/quest/engine'
import { LessonPlayer, type FinishView } from './LessonPlayer'
import { useQuest } from './useQuest'

const LEVELS = [
  { name: 'Beginner', tint: 'from-teal-500 to-emerald-500', ring: '#10b981' },
  { name: 'Intermediate', tint: 'from-sky-500 to-indigo-500', ring: '#6366f1' },
  { name: 'Advanced', tint: 'from-violet-500 to-fuchsia-500', ring: '#a855f7' },
]
const ZIG = [0, 70, 100, 70, 0, -70, -100, -70] // horizontal offsets that make the path wind

type Playing = { kind: 'lesson'; level: number; index: number; attempt: number } | { kind: 'placement'; level: number }

export function QuestPath({ track, placement }: { track: Track; placement: number | null }) {
  const q = useQuest()
  const shape: TrackShape = useMemo(() => ({ id: track.id, lessonIds: track.levels.map((l) => l.lessons.map((x) => x.id)) }), [track])
  const p = q.progress(track.id)
  const states = lessonStates(shape, p)
  const [playing, setPlaying] = useState<Playing | null>(null)

  // arriving from the niche reveal with ?placement=<level>: start the placement test right away
  useEffect(() => {
    if (q.ready && placement !== null && !p.placed) setPlaying({ kind: 'placement', level: placement })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.ready])

  const lessonOf = (pl: Extract<Playing, { kind: 'lesson' }>) => track.levels[pl.level].lessons[pl.index]

  const player = (() => {
    if (!playing) return null
    if (playing.kind === 'placement') {
      const pool = track.levels[playing.level].lessons.flatMap((l) => l.q)
      const qs = seededShuffle(pool, `${track.id}-place-${playing.level}`).slice(0, 5)
      return (
        <LessonPlayer
          key={`place-${playing.level}`}
          title={`${LEVELS[playing.level].name} placement`}
          kicker={track.name}
          questions={qs}
          seed={`${track.id}-place-${playing.level}`}
          mode="placement"
          trackId={track.id}
          level={playing.level}
          onFinish={async (score): Promise<FinishView | null> => {
            const out = await q.placement(track.id, playing.level, score)
            return out ? { xp: out.xp, passed: true, earned: out.earned, placedLevel: out.level } : null
          }}
          onClose={() => setPlaying(null)}
        />
      )
    }
    const lesson = lessonOf(playing)
    const seed = `${lesson.id}-${playing.attempt}`
    return (
      <LessonPlayer
        key={seed}
        title={lesson.title}
        kicker={`${track.name} · ${LEVELS[playing.level].name}`}
        questions={seededShuffle(lesson.q, seed)}
        seed={seed}
        mode="lesson"
        trackId={track.id}
        level={playing.level}
        topics={lesson.topics}
        onFinish={async (score) => {
          const out = await q.lesson(shape, lesson.id, score)
          return out ? { xp: out.xp, passed: out.passed, earned: out.earned, levelCleared: out.levelCleared } : null
        }}
        onClose={() => setPlaying(null)}
        onRetry={() => setPlaying({ ...playing, attempt: playing.attempt + 1 })}
      />
    )
  })()

  const doneCount = Object.values(states).filter((s) => s === 'done' || s === 'skipped').length
  const total = shape.lessonIds.flat().length

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {player}

      {/* header + stats */}
      <div className="rounded-3xl bg-gradient-to-br from-primary to-accent p-5 text-white shadow-lg sm:p-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden>{track.emoji}</span>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-white/70">Quest</p>
            <h1 className="truncate text-2xl font-semibold">{track.name}</h1>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Stat icon={<Star className="h-5 w-5 text-amber-300" />} value={q.stats.xp} label="XP" />
          <Stat icon={<Flame className={`h-5 w-5 ${q.stats.streak ? 'text-orange-300' : 'text-white/40'}`} />} value={q.stats.streak} label={q.stats.streak === 1 ? 'day streak' : 'day streak'} pulse={q.stats.streak > 0} />
          <Stat icon={<Trophy className="h-5 w-5 text-amber-200" />} value={`${doneCount}/${total}`} label="lessons" />
        </div>
        {q.guest && q.ready && (
          <p className="mt-4 text-xs text-white/80">
            Progress is kept in this browser. <Link href={`/register?next=/quest/${track.id}`} className="underline">Sign up</Link> to keep it everywhere.
          </p>
        )}
      </div>

      {/* placement offer */}
      {q.ready && !p.placed && (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary-50/50 p-4">
          <p className="font-medium text-gray-900">Already know some of this?</p>
          <p className="text-sm text-gray-600">Take a five-question placement test and skip ahead.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEVELS.map((l, i) => (
              <button key={l.name} onClick={() => setPlaying({ kind: 'placement', level: i })} className="rounded-xl bg-white px-3 py-1.5 text-sm font-medium text-primary ring-1 ring-primary/30 hover:bg-primary hover:text-white">
                Test me at {l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* the path */}
      <div className="mt-8 space-y-10">
        {track.levels.map((lv, level) => {
          const cleared = levelDone(shape, p, level)
          return (
            <section key={level} aria-label={`${LEVELS[level].name} level`}>
              <div className={`flex items-center justify-between rounded-2xl bg-gradient-to-r ${LEVELS[level].tint} px-5 py-3 text-white shadow-md`}>
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/80">Level {level + 1}</p>
                  <p className="text-lg font-semibold">{LEVELS[level].name}</p>
                </div>
                {cleared ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm"><Check className="h-4 w-4" /> {level < p.level ? 'Placed above' : 'Cleared'}</span>
                ) : (
                  <span className="text-sm text-white/80">{lv.lessons.filter((x) => (p.lessons[x.id] ?? 0) >= PASS).length}/{lv.lessons.length}</span>
                )}
              </div>
              <ol className="mt-12 flex flex-col items-center gap-7">
                {lv.lessons.map((lesson, index) => {
                  const st = states[lesson.id]
                  const n = shape.lessonIds.slice(0, level).flat().length + index
                  const best = p.lessons[lesson.id] ?? 0
                  return (
                    <li key={lesson.id} className="relative flex flex-col items-center" style={{ transform: `translateX(${ZIG[n % ZIG.length]}px)` }}>
                      {st === 'current' && (
                        <motion.span initial={{ y: 0 }} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="absolute -top-10 whitespace-nowrap rounded-xl border-2 border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm">
                          Start
                        </motion.span>
                      )}
                      <motion.button
                        type="button"
                        disabled={st === 'locked'}
                        onClick={() => setPlaying({ kind: 'lesson', level, index, attempt: 0 })}
                        whileHover={st === 'locked' ? undefined : { scale: 1.08 }}
                        whileTap={st === 'locked' ? undefined : { scale: 0.92, y: 4 }}
                        animate={st === 'current' ? { scale: [1, 1.06, 1] } : {}}
                        transition={st === 'current' ? { repeat: Infinity, duration: 2 } : { type: 'spring', stiffness: 400, damping: 15 }}
                        aria-label={`${lesson.title}: ${st}${best ? `, best ${best}/5` : ''}`}
                        className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white ${
                          st === 'done'
                            ? 'bg-gradient-to-b from-amber-300 to-amber-500 shadow-[0_6px_0_0_#b45309]'
                            : st === 'current'
                              ? 'bg-gradient-to-b from-primary-light to-primary shadow-[0_6px_0_0_#1f5c5c]'
                              : st === 'skipped'
                                ? 'bg-gradient-to-b from-gray-200 to-gray-300 text-gray-600 shadow-[0_6px_0_0_#9ca3af]'
                                : 'cursor-not-allowed bg-gray-200 text-gray-400 shadow-[0_6px_0_0_#d1d5db]'
                        }`}
                      >
                        {st === 'done' ? <Check className="h-9 w-9" strokeWidth={3} /> : st === 'skipped' ? <ChevronsRight className="h-8 w-8" /> : st === 'locked' ? <Lock className="h-7 w-7" /> : <Star className="h-9 w-9 fill-white" />}
                      </motion.button>
                      <span className="mt-3 max-w-[11rem] text-center text-sm font-medium text-gray-800">{lesson.title}</span>
                      {best > 0 && <span className="text-xs text-gray-500">best {best}/5</span>}
                    </li>
                  )
                })}
                <li style={{ transform: `translateX(${ZIG[(shape.lessonIds.slice(0, level + 1).flat().length) % ZIG.length]}px)` }} className="flex flex-col items-center">
                  <motion.div animate={cleared ? { rotate: [0, -8, 8, 0] } : {}} transition={{ repeat: cleared ? Infinity : 0, duration: 2.4, repeatDelay: 1.5 }} className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${cleared ? 'bg-amber-100' : 'bg-gray-100 grayscale'}`} aria-hidden>
                    🏆
                  </motion.div>
                  <span className="mt-2 text-xs text-gray-500">{cleared ? `${LEVELS[level].name} cleared` : `Clear ${LEVELS[level].name}`}</span>
                </li>
              </ol>
            </section>
          )
        })}
      </div>

      {/* milestones */}
      <section className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900">Milestones</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.entries(BADGES).map(([id, b]) => {
            const got = q.stats.badges.includes(id)
            return (
              <li key={id} title={b.detail} className={`rounded-2xl border p-3 text-center ${got ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white opacity-50 grayscale'}`}>
                <span className="text-2xl" aria-hidden>{b.emoji}</span>
                <p className="mt-1 text-xs font-medium text-gray-800">{b.label}</p>
                <p className="text-[10px] text-gray-500">{b.detail}</p>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function Stat({ icon, value, label, pulse = false }: { icon: React.ReactNode; value: number | string; label: string; pulse?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-3">
      <motion.div className="flex justify-center" animate={pulse ? { scale: [1, 1.18, 1] } : {}} transition={{ repeat: Infinity, duration: 1.4 }}>
        {icon}
      </motion.div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-white/75">{label}</p>
    </div>
  )
}
