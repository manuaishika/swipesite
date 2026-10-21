'use client'

import { useEffect, useMemo, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { Check, Heart, X } from 'lucide-react'
import { areaLabel } from '@/lib/niche-core'
import { displayKeywords, keyPoints } from '@/lib/abstract-points'

export type DemoCard = {
  title: string
  abstract: string
  category: string
  keywords: string[]
  year: number | null
  /** scripted decision for the demo */
  like: boolean
}

// Used only when the database has too few papers. Abstract text here is our own short
// description of each paper (not a quote), so it's labelled as an example.
const FALLBACK: DemoCard[] = [
  {
    title: 'Attention Is All You Need',
    year: 2017,
    category: 'cs.CL',
    keywords: ['transformer', 'attention', 'machine translation'],
    abstract:
      'Sequence models at the time relied on recurrence or convolution. The authors propose the Transformer, built entirely on attention. It reaches better translation quality while training faster and in parallel.',
    like: true,
  },
  {
    title: 'Deep Residual Learning for Image Recognition',
    year: 2015,
    category: 'cs.CV',
    keywords: ['residual networks', 'image classification'],
    abstract:
      'Very deep networks are hard to train. The authors add skip connections so layers learn residual functions. This lets networks with over a hundred layers train well and improves accuracy on image benchmarks.',
    like: false,
  },
  {
    title: 'Language Models are Few-Shot Learners',
    year: 2020,
    category: 'cs.CL',
    keywords: ['language model', 'few-shot', 'scaling'],
    abstract:
      'Task-specific fine-tuning needs labelled data for every task. The authors train a very large language model and give it a few examples in the prompt instead. Performance on many tasks improves steadily with model size.',
    like: true,
  },
  {
    title: 'Playing Atari with Deep Reinforcement Learning',
    year: 2013,
    category: 'cs.LG',
    keywords: ['reinforcement learning', 'Q-learning'],
    abstract:
      'Learning control directly from pixels is difficult. The authors train a convolutional network with a variant of Q-learning on raw screen input. The agent learns to play several Atari games, beating earlier approaches on most.',
    like: false,
  },
]

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function SwipeDemo({ cards }: { cards: DemoCard[] | null }) {
  const deck = cards && cards.length >= 3 ? cards : FALLBACK
  const isExample = deck === FALLBACK
  const [i, setI] = useState(0)
  const [rated, setRated] = useState<Record<string, [number, number]>>({})
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-12, 12])
  const yes = useTransform(x, [15, 90], [0, 1])
  const no = useTransform(x, [-90, -15], [1, 0])
  const iconScale = useTransform(x, [-140, 0, 140], [1, 0.6, 1])

  const card = deck[i % deck.length]
  const next = deck[(i + 1) % deck.length]
  const points = useMemo(() => keyPoints(card.abstract, 2), [card.abstract])
  const keywords = displayKeywords(card.keywords, 4)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // time to read the card, then a quick decision
      await wait(1300)
      if (cancelled) return
      const dir = card.like ? 1 : -1
      if (!reduce) {
        await animate(x, dir * 70, { type: 'spring', stiffness: 520, damping: 24 })
        await wait(150)
        if (cancelled) return
        await animate(x, dir * 650, { duration: 0.28, ease: [0.3, 0.6, 0.4, 1] })
      }
      if (cancelled) return
      const atEnd = (i + 1) % deck.length === 0
      setRated((prev) => {
        if (atEnd) return {}
        const [l, n] = prev[card.category] ?? [0, 0]
        return { ...prev, [card.category]: [l + (card.like ? 1 : 0), n + 1] }
      })
      x.set(0)
      setI((n) => n + 1)
    })()
    return () => {
      cancelled = true
    }
  }, [i, card, deck.length, reduce, x])

  const rows = Object.entries(rated).sort((a, b) => b[1][1] - a[1][1]).slice(0, 3)

  return (
    <div className="relative mx-auto w-full max-w-md select-none" aria-label="Animated demo of rating paper abstracts">
      <div className="relative h-[21rem] sm:h-[23rem]">
        <div className="absolute inset-0 translate-y-2.5 scale-[0.96] rounded-3xl border border-gray-200 bg-white p-5 shadow-md">
          <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">{areaLabel(next.category)}</span>
          <p className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-gray-300">{next.title}</p>
        </div>
        <motion.div
          key={i}
          initial={{ scale: 0.96, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="absolute inset-0"
        >
          <motion.div style={{ x, rotate }} className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <motion.div data-stamp="yes" style={{ opacity: yes, scale: iconScale }} className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl">
                <Check className="h-11 w-11" strokeWidth={3} />
              </motion.div>
              <motion.div data-stamp="no" style={{ opacity: no, scale: iconScale }} className="absolute flex h-20 w-20 items-center justify-center rounded-full bg-rose-500 text-white shadow-xl">
                <X className="h-11 w-11" strokeWidth={3} />
              </motion.div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {areaLabel(card.category)} <span className="text-primary-700/60">{card.category}</span>
              </span>
              {card.year && <span className="text-xs text-gray-400">{card.year}</span>}
              {isExample && <span className="text-xs text-gray-400">· example</span>}
            </div>
            <h3 className="mt-2.5 line-clamp-2 text-base font-semibold leading-snug text-gray-900 sm:text-lg">{card.title}</h3>
            {keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {keywords.map((k) => (
                  <span key={k} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-700">
                    {k}
                  </span>
                ))}
              </div>
            )}
            <ul className="mt-3 space-y-1.5 overflow-hidden text-[13px] leading-relaxed text-gray-700">
              {points.map((p) => (
                <li key={p.label} className="line-clamp-3">
                  <span className="mr-1 font-semibold text-primary-700">{p.label}.</span>
                  {p.text}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex justify-center gap-4 pt-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-rose-200 bg-white text-rose-500">
                <X className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-primary text-white">
                <Heart className="h-5 w-5 fill-current" />
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Your ratings by arXiv category</p>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">Each rating is counted under the paper&apos;s category.</p>
        ) : (
          rows.map(([code, [l, n]]) => (
            <div key={code} className="mt-2">
              <div className="flex justify-between gap-2 text-sm">
                <span className="truncate text-gray-700">{areaLabel(code)}</span>
                <span className="shrink-0 tabular-nums text-gray-500">
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
