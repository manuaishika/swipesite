'use client'

import { useEffect, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { Check, Heart, X } from 'lucide-react'
import { areaLabel } from '@/lib/niche-core'

// A scripted, looping demo of the swipe -> niche flow for the landing page.
// Blurbs are our own one-line summaries of well-known papers (not quotes).
const CARDS = [
  { title: 'Attention Is All You Need', year: 2017, area: 'cs.CL', blurb: 'A sequence model built entirely on attention, with no recurrence at all.', like: true },
  { title: 'Deep Residual Learning for Image Recognition', year: 2015, area: 'cs.CV', blurb: 'Skip connections that make very deep image networks trainable.', like: false },
  { title: 'Language Models are Few-Shot Learners', year: 2020, area: 'cs.CL', blurb: 'A very large language model that picks up new tasks from a few examples in the prompt.', like: true },
  { title: 'Playing Atari with Deep Reinforcement Learning', year: 2013, area: 'cs.LG', blurb: 'A deep network learns to play Atari games straight from the pixels.', like: false },
  { title: 'BERT: Pre-training of Deep Bidirectional Transformers', year: 2018, area: 'cs.CL', blurb: 'Pre-train a bidirectional Transformer on unlabelled text, then fine-tune it.', like: true },
  { title: 'Concrete Problems in AI Safety', year: 2016, area: 'cs.AI', blurb: 'Five practical ways machine learning systems can behave in unintended ways.', like: true },
]

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function SwipeDemo() {
  const [i, setI] = useState(0)
  // ratings so far, per arXiv category: [interesting, rated]
  const [rated, setRated] = useState<Record<string, [number, number]>>({})
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-16, 16])
  const yes = useTransform(x, [15, 90], [0, 1])
  const nope = useTransform(x, [-90, -15], [1, 0])
  const yesScale = useTransform(x, [15, 140], [0.5, 1.1])
  const noScale = useTransform(x, [-140, -15], [1.1, 0.5])

  const card = CARDS[i % CARDS.length]
  const next = CARDS[(i + 1) % CARDS.length]

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await wait(650)
      if (cancelled) return
      const dir = card.like ? 1 : -1
      if (!reduce) {
        // a little "considering it" wiggle, then the throw
        await animate(x, dir * 60, { type: 'spring', stiffness: 520, damping: 22 })
        await wait(120)
        if (cancelled) return
        await animate(x, dir * 650, { duration: 0.26, ease: [0.3, 0.6, 0.4, 1] })
      }
      if (cancelled) return
      const atEnd = (i + 1) % CARDS.length === 0
      setRated((prev) => {
        if (atEnd) return {}
        const [l, n] = prev[card.area] ?? [0, 0]
        return { ...prev, [card.area]: [l + (card.like ? 1 : 0), n + 1] }
      })
      x.set(0)
      setI((n) => n + 1)
    })()
    return () => {
      cancelled = true
    }
  }, [i, card, reduce, x])

  const rows = Object.entries(rated).sort((a, b) => b[1][1] - a[1][1]).slice(0, 4)
  const total = Object.values(rated).reduce((n, [, k]) => n + k, 0)

  return (
    <div className="relative mx-auto w-full max-w-md select-none" aria-label="Animated demo of swiping paper abstracts">
      <div className="relative h-[20rem]">
        {/* next card peeking out underneath */}
        <div className="absolute inset-0 translate-y-3 scale-[0.95] rounded-[2rem] border border-gray-200 bg-white p-6 shadow-lg">
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">{areaLabel(next.area)} · {next.area}</span>
          <p className="mt-4 line-clamp-2 text-xl font-extrabold leading-tight text-gray-300">{next.title}</p>
        </div>
        <motion.div
          key={i}
          initial={{ scale: 0.95, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="absolute inset-0"
        >
          <motion.div style={{ x, rotate }} className="relative h-full overflow-hidden rounded-[2rem] border border-gray-200 bg-white p-6 shadow-2xl">
            <motion.div data-stamp="yes" style={{ opacity: yes, scale: yesScale }} className="absolute left-5 top-5 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-4 ring-white">
              <Check className="h-9 w-9" strokeWidth={3.5} />
            </motion.div>
            <motion.div data-stamp="no" style={{ opacity: nope, scale: noScale }} className="absolute right-5 top-5 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg ring-4 ring-white">
              <X className="h-9 w-9" strokeWidth={3.5} />
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">{areaLabel(card.area)} · {card.area}</span>
              <span className="text-xs text-gray-400">{card.year}</span>
            </div>
            <h3 className="mt-4 text-xl font-extrabold leading-tight tracking-tight text-gray-900">{card.title}</h3>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Abstract</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{card.blurb}</p>
            <div className="absolute inset-x-0 bottom-5 flex justify-center gap-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-rose-200 bg-white text-rose-500 shadow">
                <X className="h-6 w-6" strokeWidth={3} />
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-primary text-white shadow">
                <Heart className="h-6 w-6 fill-current" />
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Evidence by arXiv category</p>
          <p className="text-xs tabular-nums text-gray-400">{total} rated</p>
        </div>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">Each rating adds a data point to its category…</p>
        ) : (
          rows.map(([code, [l, n]]) => (
            <div key={code} className="mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {areaLabel(code)} <span className="text-xs text-gray-400">{code}</span>
                </span>
                <span className="tabular-nums text-gray-500">
                  {l} of {n} interesting
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(l / n) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
