'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowRight, BookOpen, Check, Gauge, RotateCcw, X } from 'lucide-react'
import type { Q } from '@/lib/quest/bank'
import { BADGES, PASS, seededShuffle } from '@/lib/quest/engine'
import { Confetti } from './Confetti'

export type FinishView = { xp: number; passed: boolean; earned: string[]; levelCleared?: number | null; placedLevel?: number }

type Props = {
  title: string
  kicker: string // e.g. "Machine Learning · Beginner"
  questions: Q[]
  seed: string
  mode: 'lesson' | 'placement'
  trackId: string
  level: number
  topics?: string[]
  onFinish: (score: number) => Promise<FinishView | null>
  onClose: () => void
  onRetry?: () => void
}

const LEVEL_NAMES = ['Beginner', 'Intermediate', 'Advanced']

/** Full-screen, one question at a time: pick, check, see why, continue. Then the results screen. */
export function LessonPlayer({ title, kicker, questions, seed, mode, trackId, level, topics = [], onFinish, onClose, onRetry }: Props) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [right, setRight] = useState(0)
  const [result, setResult] = useState<FinishView | null>(null)
  const [saving, setSaving] = useState(false)

  const q = questions[i]
  const order = useMemo(() => seededShuffle([0, 1, 2, 3], `${seed}-${i}`), [seed, i])
  const [prompt, quote] = q ? q[0].split('\n\n') : ['', undefined]
  const correct = picked === q?.[2]

  const check = useCallback(() => {
    if (picked === null || checked) return
    setChecked(true)
    if (picked === q[2]) setRight((r) => r + 1)
  }, [picked, checked, q])

  const next = useCallback(async () => {
    if (!checked) return
    if (i + 1 < questions.length) {
      setI(i + 1)
      setPicked(null)
      setChecked(false)
      return
    }
    setSaving(true)
    const view = await onFinish(right)
    setSaving(false)
    setResult(view ?? { xp: 0, passed: right >= PASS, earned: [] })
  }, [checked, i, questions.length, onFinish, right])

  // keyboard: 1–4 to pick, Enter to check / continue, Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (result) return
      if (e.key === 'Escape') onClose()
      if (!checked && ['1', '2', '3', '4'].includes(e.key)) setPicked(order[Number(e.key) - 1])
      if (e.key === 'Enter') (checked ? next : check)()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [checked, check, next, onClose, order, result])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={title}>
      {result ? (
        <Results
          result={result}
          score={right}
          total={questions.length}
          mode={mode}
          title={title}
          trackId={trackId}
          level={result.placedLevel ?? level}
          topics={topics}
          onClose={onClose}
          onRetry={onRetry}
        />
      ) : (
        <>
          {/* top bar: close + progress */}
          <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 pt-5 sm:px-6">
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
            <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-200" role="progressbar" aria-valuenow={i + (checked ? 1 : 0)} aria-valuemax={questions.length}>
              <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400" animate={{ width: `${((i + (checked ? 1 : 0)) / questions.length) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
            </div>
          </div>

          {/* question */}
          <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 pb-40 pt-6 sm:px-6 sm:pt-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{mode === 'placement' ? 'Placement test' : kicker}</p>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
                <h2 className="mt-2 text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">{prompt}</h2>
                {quote && <blockquote className="mt-4 rounded-2xl border-l-4 border-primary bg-gray-50 p-4 text-[15px] leading-relaxed text-gray-700">{quote}</blockquote>}
                <div className="mt-6 grid gap-3">
                  {order.map((opt, k) => {
                    const isPicked = picked === opt
                    const isRight = opt === q[2]
                    const tone = checked
                      ? isRight
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : isPicked
                          ? 'border-rose-400 bg-rose-50 text-rose-900'
                          : 'border-gray-200 text-gray-400'
                      : isPicked
                        ? 'border-primary bg-primary-50 text-gray-900 shadow-[0_4px_0_0_#2f8f83]'
                        : 'border-gray-200 text-gray-800 shadow-[0_4px_0_0_#e5e7eb] hover:bg-gray-50'
                    return (
                      <motion.button
                        key={opt}
                        type="button"
                        disabled={checked}
                        onClick={() => setPicked(opt)}
                        whileTap={checked ? undefined : { y: 3, boxShadow: '0 1px 0 0 #e5e7eb' }}
                        animate={checked && isPicked && !isRight ? { x: [0, -8, 8, -5, 5, 0] } : checked && isRight ? { scale: [1, 1.03, 1] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] transition-colors ${tone}`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current text-xs font-semibold opacity-60">{k + 1}</span>
                        {q[1][opt]}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* bottom: check button, then the feedback sheet */}
          <div className={`fixed inset-x-0 bottom-0 border-t-2 transition-colors ${checked ? (correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50') : 'border-gray-100 bg-white'}`}>
            <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
              <AnimatePresence>
                {checked && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${correct ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                      {correct ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                    </span>
                    <div>
                      <p className={`font-semibold ${correct ? 'text-emerald-800' : 'text-rose-800'}`}>{correct ? ['Nice!', 'Correct!', 'Exactly.'][i % 3] : 'Not quite.'}</p>
                      <p className={`text-sm ${correct ? 'text-emerald-900' : 'text-rose-900'}`}>
                        {!correct && <>Answer: {q[1][q[2]]}. </>}
                        {q[3]}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!checked && <div className="hidden flex-1 sm:block" />}
              <motion.button
                type="button"
                whileTap={{ y: 3 }}
                disabled={picked === null || saving}
                onClick={checked ? next : check}
                className={`rounded-2xl px-8 py-3.5 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:min-w-[11rem] ${
                  checked && !correct ? 'bg-rose-500 shadow-[0_4px_0_0_#be123c]' : 'bg-primary shadow-[0_4px_0_0_#1f5c5c]'
                }`}
              >
                {saving ? 'Saving…' : checked ? 'Continue' : 'Check'}
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CountUp({ to }: { to: number }) {
  const v = useMotionValue(0)
  const shown = useTransform(v, (x) => Math.round(x))
  useEffect(() => {
    const c = animate(v, to, { duration: 1.2, ease: 'easeOut', delay: 0.4 })
    return () => c.stop()
  }, [to, v])
  return <motion.span>{shown}</motion.span>
}

function Results({
  result, score, total, mode, title, trackId, level, topics, onClose, onRetry,
}: {
  result: FinishView; score: number; total: number; mode: 'lesson' | 'placement'; title: string; trackId: string; level: number; topics: string[]; onClose: () => void; onRetry?: () => void
}) {
  const [papers, setPapers] = useState<{ id: string; title: string }[]>([])
  useEffect(() => {
    fetch(`/api/quest/recommend?track=${encodeURIComponent(trackId)}&level=${level}`)
      .then((r) => (r.ok ? r.json() : { papers: [] }))
      .then((d) => setPapers(d.papers ?? []))
      .catch(() => {})
  }, [trackId, level])
  const win = mode === 'placement' || result.passed
  const headline =
    mode === 'placement'
      ? `You start at ${LEVEL_NAMES[level]}`
      : result.levelCleared != null
        ? `${LEVEL_NAMES[result.levelCleared]} cleared!`
        : result.passed
          ? score === total
            ? 'Perfect lesson!'
            : 'Lesson complete!'
          : score >= PASS - 1
            ? 'So close'
            : 'Keep going'

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-y-auto px-4 pb-10 pt-12 text-center sm:pt-16">
      {win && <Confetti count={result.levelCleared != null ? 120 : 70} />}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12 }}
        className={`flex h-28 w-28 items-center justify-center rounded-full text-6xl shadow-xl ${win ? 'bg-gradient-to-br from-amber-300 to-amber-500' : 'bg-gray-200'}`}
        aria-hidden
      >
        {mode === 'placement' ? '🧭' : result.levelCleared != null ? '🏆' : result.passed ? (score === total ? '💎' : '⭐') : '💪'}
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 text-3xl font-semibold text-gray-900">
        {headline}
      </motion.h2>
      <p className="mt-1 text-gray-600">
        {title} · {score} of {total} right
        {mode === 'lesson' && !result.passed && ` · ${PASS} of ${total} unlocks the next lesson`}
      </p>

      <div className="mt-6 flex gap-3">
        <div className="min-w-[7rem] rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">XP</p>
          <p className="text-2xl font-semibold tabular-nums text-amber-900">
            +<CountUp to={result.xp} />
          </p>
        </div>
        <div className="min-w-[7rem] rounded-2xl border-2 border-emerald-300 bg-emerald-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Accuracy</p>
          <p className="text-2xl font-semibold tabular-nums text-emerald-900">{Math.round((score / total) * 100)}%</p>
        </div>
      </div>

      {result.earned.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {result.earned.map((b, k) => (
            <motion.span
              key={b}
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.8 + k * 0.15 }}
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            >
              <span aria-hidden>{BADGES[b]?.emoji}</span> {BADGES[b]?.label ?? b}
            </motion.span>
          ))}
        </div>
      )}

      {(papers.length > 0 || topics.length > 0) && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mt-8 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 text-left">
          <h3 className="font-medium text-gray-900">Read next</h3>
          <ul className="mt-3 space-y-2">
            {papers.map((p) => (
              <li key={p.id}>
                <Link href={`/paper/${p.id}`} className="flex items-start gap-2 text-sm text-gray-800 hover:text-primary">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {p.title}
                </Link>
              </li>
            ))}
          </ul>
          {topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((t) => (
                <Link key={t} href={`/landscape/niche?q=${encodeURIComponent(t)}`} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary hover:bg-primary-100">
                  <Gauge className="h-3.5 w-3.5" /> How big is “{t}”?
                </Link>
              ))}
            </div>
          )}
        </motion.section>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {mode === 'lesson' && !result.passed && onRetry && (
          <button onClick={onRetry} className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        )}
        <motion.button whileTap={{ y: 3 }} onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 font-semibold text-white shadow-[0_4px_0_0_#1f5c5c]">
          Continue <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  )
}
