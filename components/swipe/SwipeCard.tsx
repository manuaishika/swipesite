'use client'

import { forwardRef } from 'react'
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Calendar, ExternalLink, Heart, Users, X } from 'lucide-react'
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

type Props = {
  paper: SwipePaper
  inNiche: boolean
  onDecide: (liked: boolean) => void
  /** Read at exit time: 1 = interested (fly right), -1 = skip (fly left), 0 = undo (fade). */
  getExitDirection: () => number
}

export const SwipeCard = forwardRef<HTMLDivElement, Props>(function SwipeCard(
  { paper, inNiche, onDecide, getExitDirection },
  ref,
) {
  // A removed card keeps its last props, so the exit direction is read from the deck at exit time.
  const variants = {
    enter: { scale: 0.96, opacity: 0, y: 12 },
    center: { scale: 1, opacity: 1, y: 0 },
    exit: () => {
      const dir = getExitDirection() || 0
      return { x: dir * 700, rotate: dir * 18, opacity: 0, transition: { duration: 0.35 } }
    },
  }
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-250, 250], [-10, 10])
  const likeOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1])
  const skipOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) onDecide(true)
    else if (info.offset.x < -SWIPE_THRESHOLD) onDecide(false)
  }

  const authors = paper.authors.length > 3 ? `${paper.authors.slice(0, 3).join(', ')} et al.` : paper.authors.join(', ')
  const areas = Array.from(new Set(paper.categories.map(areaLabel))).slice(0, 3)

  return (
    // Outer layer: enter/exit animation. Inner layer: drag. Kept separate so the exit
    // animation never fights the drag gesture over the same `x` value.
    <motion.div
      ref={ref}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0"
    >
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={onDragEnd}
        className="relative flex h-full cursor-grab select-none flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl active:cursor-grabbing"
      >
        {/* drag stamps */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-6 top-6 z-10 flex rotate-[-10deg] items-center gap-1.5 rounded-xl border-4 border-emerald-500 px-3 py-1 text-xl font-extrabold uppercase tracking-wide text-emerald-600"
        >
          <Heart className="h-5 w-5" /> Interested
        </motion.div>
        <motion.div
          style={{ opacity: skipOpacity }}
          className="pointer-events-none absolute right-6 top-6 z-10 flex rotate-[10deg] items-center gap-1.5 rounded-xl border-4 border-rose-500 px-3 py-1 text-xl font-extrabold uppercase tracking-wide text-rose-600"
        >
          <X className="h-5 w-5" /> Skip
        </motion.div>

        <div className="px-6 pt-6 sm:px-8 sm:pt-7">
          <div className="flex flex-wrap items-center gap-1.5">
            {inNiche && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                In your niche
              </span>
            )}
            {areas.map((a) => (
              <span key={a} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                {a}
              </span>
            ))}
          </div>
          <h2 className="mt-3 text-xl font-bold leading-snug text-gray-900 sm:text-2xl">{paper.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
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

        {/* the abstract is the point: show all of it */}
        <div className="mt-4 flex-1 overflow-y-auto px-6 pb-4 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Abstract</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-gray-800">{paper.abstract}</p>
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
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
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
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                PDF <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
})
