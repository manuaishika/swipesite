'use client'

import { useCallback, useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Calendar, ExternalLink, Users } from 'lucide-react'
import { format } from 'date-fns'
import { areaLabel } from '@/lib/niche-core'

export type SwipePaper = {
  id: string
  title: string
  abstract: string
  authors: string[]
  arxivId: string | null
  url: string | null
  pdfUrl: string | null
  publishedDate: Date | string | null
  categories: string[]
  likes: Array<{ id: string }>
}

const SWIPE_THRESHOLD = 110
const FLING_VELOCITY = 650

type Props = {
  paper: SwipePaper
  inNiche: boolean
  /** Called once the card has flown off screen. */
  onDecide: (liked: boolean) => void
  /** Lets the deck fling this card from buttons / keyboard with the same motion as a drag. */
  registerFling: (fling: ((liked: boolean) => void) | null) => void
  /** Set when this card comes back via undo: 1 = from the right, -1 = from the left. */
  returnFrom?: number
}

export function SwipeCard({ paper, inNiche, onDecide, registerFling, returnFrom = 0 }: Props) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-14, 14])
  const yesOpacity = useTransform(x, [25, SWIPE_THRESHOLD], [0, 1])
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, -25], [1, 0])
  const yesScale = useTransform(x, [25, SWIPE_THRESHOLD * 1.6], [0.6, 1.1])
  const nopeScale = useTransform(x, [-SWIPE_THRESHOLD * 1.6, -25], [1.1, 0.6])
  const yesTint = useTransform(x, [0, 220], [0, 0.22])
  const nopeTint = useTransform(x, [-220, 0], [0.22, 0])
  const flinging = useRef(false)

  const fling = useCallback(
    (liked: boolean) => {
      if (flinging.current) return
      flinging.current = true
      const dir = liked ? 1 : -1
      const distance = typeof window === 'undefined' ? 900 : Math.max(700, window.innerWidth)
      animate(x, dir * distance, { type: 'tween', duration: 0.42, ease: [0.3, 0.6, 0.4, 1] }).then(() => onDecide(liked))
    },
    [x, onDecide]
  )

  useEffect(() => {
    registerFling(fling)
    return () => registerFling(null)
  }, [fling, registerFling])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > FLING_VELOCITY) fling(true)
    else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -FLING_VELOCITY) fling(false)
    else animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 })
  }

  const authors =
    paper.authors.length > 3 ? `${paper.authors.slice(0, 3).join(', ')} et al.` : paper.authors.join(', ')
  const areas = Array.from(new Set(paper.categories.map(areaLabel))).slice(0, 3)

  return (
    <motion.div
      initial={
        returnFrom
          ? { x: returnFrom * 600, rotate: returnFrom * 16, opacity: 0 }
          : { scale: 0.94, y: 18, opacity: 1 }
      }
      animate={{ x: 0, rotate: 0, scale: 1, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="absolute inset-0 z-10"
    >
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragMomentum={false}
        onDragEnd={onDragEnd}
        whileTap={{ scale: 1.01 }}
        className="relative flex h-full cursor-grab touch-pan-y select-none flex-col overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-2xl active:cursor-grabbing"
      >
        {/* colour wash while dragging */}
        <motion.div style={{ opacity: yesTint }} className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-l from-emerald-400 to-transparent" />
        <motion.div style={{ opacity: nopeTint }} className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-rose-400 to-transparent" />

        {/* stamps */}
        <motion.div
          style={{ opacity: yesOpacity, scale: yesScale }}
          className="pointer-events-none absolute left-6 top-8 z-20 -rotate-12 rounded-2xl border-[5px] border-emerald-500 bg-white/80 px-4 py-1.5 text-3xl font-black uppercase tracking-wider text-emerald-500 sm:text-4xl"
        >
          Yes!
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity, scale: nopeScale }}
          className="pointer-events-none absolute right-6 top-8 z-20 rotate-12 rounded-2xl border-[5px] border-rose-500 bg-white/80 px-4 py-1.5 text-3xl font-black uppercase tracking-wider text-rose-500 sm:text-4xl"
        >
          Nope
        </motion.div>

        <div className="px-6 pt-6 sm:px-8 sm:pt-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {inNiche && (
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">★ In your niche</span>
            )}
            {areas.map((a) => (
              <span key={a} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                {a}
              </span>
            ))}
          </div>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-[1.7rem]">
            {paper.title}
          </h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            {authors && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0" />
                <span className="truncate">{authors}</span>
              </span>
            )}
            {paper.publishedDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {format(new Date(paper.publishedDate), 'MMM yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* the abstract is the point: all of it, scrollable */}
        <div className="mt-5 flex-1 overflow-y-auto px-6 pb-5 sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Abstract</p>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-800 sm:text-base">{paper.abstract}</p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-3 text-sm sm:px-8">
          <span className="text-gray-500">{paper.likes.length} interested</span>
          <span className="flex gap-3">
            {(paper.url || paper.arxivId) && (
              <a
                href={paper.url || `https://arxiv.org/abs/${paper.arxivId}`}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                arXiv <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {paper.pdfUrl && (
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                PDF <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

/** A non-interactive card peeking out from under the top card, for the stacked-deck look. */
export function StackedCard({ paper, depth }: { paper: SwipePaper; depth: 1 | 2 }) {
  const areas = Array.from(new Set(paper.categories.map(areaLabel))).slice(0, 2)
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden rounded-[2rem] border border-gray-200 bg-white px-6 pt-6 shadow-lg transition-transform duration-300 sm:px-8 sm:pt-8"
      style={{ transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.045})`, zIndex: 3 - depth, opacity: depth === 1 ? 1 : 0.7 }}
    >
      <div className="flex gap-1.5">
        {areas.map((a) => (
          <span key={a} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            {a}
          </span>
        ))}
      </div>
      <p className="mt-4 line-clamp-2 text-2xl font-extrabold leading-tight tracking-tight text-gray-300">{paper.title}</p>
    </div>
  )
}
