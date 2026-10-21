'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Bookmark, BookmarkCheck, Calendar, Check, ExternalLink, Users, X } from 'lucide-react'
import { format } from 'date-fns'
import { areaLabel, fieldOf, type CategoryEvidence } from '@/lib/niche-core'
import { displayKeywords, keyPoints } from '@/lib/abstract-points'
import { DEFAULT_TAG, MAX_TAG_LENGTH, SUGGESTED_TAGS } from '@/lib/saved-tags'

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
  keywords?: string[]
  likes: Array<{ id: string }>
}

const SWIPE_THRESHOLD = 110
const FLING_VELOCITY = 650

type Props = {
  paper: SwipePaper
  /** What the evidence so far says about this paper's primary arXiv category (null if untested). */
  evidence: CategoryEvidence | null
  /** Called once the card has flown off screen. */
  onDecide: (liked: boolean) => void
  /** Lets the deck fling this card from buttons / keyboard with the same motion as a drag. */
  registerFling: (fling: ((liked: boolean) => void) | null) => void
  /** Set when this card comes back via undo: 1 = from the right, -1 = from the left. */
  returnFrom?: number
  /** Tags if this paper is saved for later, otherwise null. */
  savedTags: string[] | null
  /** Save with tags, or pass null to remove from saved. */
  onSave: (tags: string[] | null) => void
}

const stop = (e: React.PointerEvent) => e.stopPropagation()

function SaveMenu({ savedTags, onSave }: { savedTags: string[] | null; onSave: (tags: string[] | null) => void }) {
  const [open, setOpen] = useState(false)
  const [tags, setTags] = useState<string[]>(savedTags ?? [DEFAULT_TAG])
  const [custom, setCustom] = useState('')
  const toggle = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
  const options = Array.from(new Set([...SUGGESTED_TAGS, ...tags]))

  return (
    <div className="relative" onPointerDown={stop}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
          savedTags ? 'bg-amber-100 text-amber-900' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {savedTags ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {savedTags ? 'Saved' : 'Save for later'}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-gray-200 bg-white p-3 text-left shadow-xl">
          <p className="text-sm font-medium text-gray-900">Save with tags</p>
          <p className="text-xs text-gray-500">Saving doesn&apos;t count as a rating. Find it later in Collection.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {options.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                aria-pressed={tags.includes(t)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  tags.includes(t) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault()
              const t = custom.trim()
              if (t && !tags.includes(t)) setTags([...tags, t])
              setCustom('')
            }}
          >
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              maxLength={MAX_TAG_LENGTH}
              placeholder="Add your own tag"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none"
            />
            <button type="submit" className="rounded-lg border border-gray-300 px-2 text-sm text-gray-700 hover:bg-gray-50">
              Add
            </button>
          </form>
          <div className="mt-3 flex items-center justify-between">
            {savedTags ? (
              <button
                type="button"
                onClick={() => {
                  onSave(null)
                  setOpen(false)
                }}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                Remove from saved
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => {
                onSave(tags.length ? tags : [DEFAULT_TAG])
                setOpen(false)
              }}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-light"
            >
              {savedTags ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SwipeCard({ paper, evidence, onDecide, registerFling, returnFrom = 0, savedTags, onSave }: Props) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 300], [-10, 10])
  const yesOpacity = useTransform(x, [25, SWIPE_THRESHOLD], [0, 1])
  const noOpacity = useTransform(x, [-SWIPE_THRESHOLD, -25], [1, 0])
  const iconScale = useTransform(x, [-SWIPE_THRESHOLD * 1.5, 0, SWIPE_THRESHOLD * 1.5], [1, 0.6, 1])
  const yesTint = useTransform(x, [0, 220], [0, 0.18])
  const noTint = useTransform(x, [-220, 0], [0.18, 0])
  const flinging = useRef(false)

  const fling = useCallback(
    (liked: boolean) => {
      if (flinging.current) return
      flinging.current = true
      const dir = liked ? 1 : -1
      const distance = typeof window === 'undefined' ? 900 : Math.max(700, window.innerWidth)
      animate(x, dir * distance, { type: 'tween', duration: 0.38, ease: [0.3, 0.6, 0.4, 1] }).then(() => onDecide(liked))
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

  const authors = paper.authors.length > 3 ? `${paper.authors.slice(0, 3).join(', ')} et al.` : paper.authors.join(', ')
  const primary = paper.categories[0]
  const crossLists = paper.categories.slice(1, 3)
  const points = useMemo(() => keyPoints(paper.abstract), [paper.abstract])
  const keywords = displayKeywords(paper.keywords ?? [])

  return (
    <motion.div
      initial={returnFrom ? { x: returnFrom * 600, rotate: returnFrom * 12, opacity: 0 } : { scale: 0.96, y: 14, opacity: 1 }}
      animate={{ x: 0, rotate: 0, scale: 1, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="absolute inset-0 z-10"
    >
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragMomentum={false}
        onDragEnd={onDragEnd}
        className="relative flex h-full cursor-grab touch-pan-y select-none flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl active:cursor-grabbing"
      >
        {/* light colour wash + one clear icon in the middle while dragging */}
        <motion.div style={{ opacity: yesTint }} className="pointer-events-none absolute inset-0 z-10 bg-emerald-400" />
        <motion.div style={{ opacity: noTint }} className="pointer-events-none absolute inset-0 z-10 bg-rose-400" />
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <motion.div data-stamp="yes" style={{ opacity: yesOpacity, scale: iconScale }} className="absolute flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-white shadow-2xl">
            <Check className="h-14 w-14" strokeWidth={3} />
          </motion.div>
          <motion.div data-stamp="no" style={{ opacity: noOpacity, scale: iconScale }} className="absolute flex h-24 w-24 items-center justify-center rounded-full bg-rose-500 text-white shadow-2xl">
            <X className="h-14 w-14" strokeWidth={3} />
          </motion.div>
        </div>

        <div className="px-5 pt-5 sm:px-7 sm:pt-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {primary ? (
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {fieldOf(primary).label} › {areaLabel(primary)} <span className="text-primary-700/60">{primary}</span>
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">Uncategorised</span>
            )}
            {crossLists.map((c) => (
              <span key={c} title={areaLabel(c)} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                also {c}
              </span>
            ))}
            {evidence?.status === 'likely' && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-white">Likely niche category</span>
            )}
            {evidence?.status === 'uncertain' && evidence.seen >= 2 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Testing this category</span>
            )}
          </div>
          <h2 className="mt-3 text-lg font-semibold leading-snug text-gray-900 sm:text-2xl">{paper.title}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 sm:text-sm">
            {authors && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{authors}</span>
              </span>
            )}
            {paper.publishedDate && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(paper.publishedDate), 'MMM yyyy')}
              </span>
            )}
          </div>
          {keywords.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {keywords.map((k) => (
                <span key={k} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                  {k}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 flex-1 overflow-y-auto px-5 pb-4 sm:px-7">
          {points.length > 0 && (
            <div className="rounded-xl bg-gray-50 p-3 sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Key points · from the abstract</p>
              <ul className="mt-2 space-y-2">
                {points.map((p) => (
                  <li key={p.label} className="text-sm leading-relaxed text-gray-800">
                    <span className="mr-1.5 font-semibold text-primary-700">{p.label}.</span>
                    {p.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Full abstract</p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-700 sm:text-[15px]">{paper.abstract}</p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 text-sm sm:px-6">
          <SaveMenu key={paper.id} savedTags={savedTags} onSave={onSave} />
          <span className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-500 sm:inline">{paper.likes.length} interested</span>
            {(paper.url || paper.arxivId) && (
              <a
                href={paper.url || `https://arxiv.org/abs/${paper.arxivId}`}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={stop}
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
                onPointerDown={stop}
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
}

/** A non-interactive card peeking out from under the top card, for the stacked-deck look. */
export function StackedCard({ paper, depth }: { paper: SwipePaper; depth: 1 | 2 }) {
  const primary = paper.categories[0]
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden rounded-3xl border border-gray-200 bg-white px-5 pt-5 shadow-md sm:px-7 sm:pt-6"
      style={{ transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`, zIndex: 3 - depth, opacity: depth === 1 ? 1 : 0.7 }}
    >
      {primary && (
        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">{areaLabel(primary)}</span>
      )}
      <p className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-gray-300 sm:text-2xl">{paper.title}</p>
    </div>
  )
}
