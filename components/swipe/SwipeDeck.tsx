'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { ArrowRight, Heart, Loader2, MessagesSquare, RotateCcw, X } from 'lucide-react'
import { applySwipe, nicheAffinity, nicheFromTally, type NicheTally } from '@/lib/niche-core'
import { NichePanel } from './NichePanel'
import { SwipeCard, type SwipePaper } from './SwipeCard'

type Paper = SwipePaper & { keywords: string[] }

export function SwipeDeck({ initialPapers, initialTally }: { initialPapers: Paper[]; initialTally: NicheTally }) {
  const [papers, setPapers] = useState(initialPapers)
  const [index, setIndex] = useState(0)
  const exitDirection = useRef(0)
  const getExitDirection = useCallback(() => exitDirection.current, [])
  const [tally, setTally] = useState(initialTally)
  const [history, setHistory] = useState<{ paper: Paper; liked: boolean }[]>([])
  const [lastPick, setLastPick] = useState<Paper | null>(null)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const niche = useMemo(() => nicheFromTally(tally), [tally])
  const current = papers[index]

  const fetchMore = useCallback(async () => {
    if (fetchingMore) return
    setFetchingMore(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/papers/fetch-more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.papers?.length) {
        setPapers((prev) => {
          const seen = new Set(prev.map((p) => p.id))
          return [...prev, ...data.papers.filter((p: Paper) => !seen.has(p.id))]
        })
      } else if (!res.ok) {
        setFetchError(data.error || 'Could not fetch more papers')
      }
    } catch {
      setFetchError('Could not reach arXiv. Try again in a moment.')
    } finally {
      setFetchingMore(false)
    }
  }, [fetchingMore])

  const decide = useCallback(
    (liked: boolean) => {
      const paper = papers[index]
      if (!paper) return
      exitDirection.current = liked ? 1 : -1
      setIndex((i) => i + 1)
      setTally((t) => applySwipe(t, { liked, categories: paper.categories, keywords: paper.keywords }))
      setHistory((h) => [...h, { paper, liked }])
      setLastPick(liked ? paper : null)

      // Fire-and-forget: the like route upserts, so a later re-decision (undo) simply overwrites it.
      fetch('/api/papers/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.id, liked }),
      }).catch((e) => console.error('Error saving swipe:', e))
      fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: liked ? 'like' : 'skip', paperId: paper.id }),
      }).catch(() => {})

      if (index + 1 >= papers.length - 3) fetchMore()
    },
    [papers, index, fetchMore]
  )

  const undo = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return
    exitDirection.current = 0
    setHistory((h) => h.slice(0, -1))
    setTally((t) => applySwipe(t, { liked: last.liked, categories: last.paper.categories, keywords: last.paper.keywords }, -1))
    setIndex((i) => i - 1)
    setLastPick(null)
  }, [history])

  // Keyboard: <- skip, -> interested, z / backspace undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowRight') decide(true)
      else if (e.key === 'ArrowLeft') decide(false)
      else if (e.key === 'z' || e.key === 'Backspace') undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [decide, undo])

  // The "saved" nudge fades after a few seconds.
  useEffect(() => {
    if (!lastPick) return
    const id = setTimeout(() => setLastPick(null), 6000)
    return () => clearTimeout(id)
  }, [lastPick])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <div className="relative h-[30rem] sm:h-[34rem]">
          {current ? (
            <AnimatePresence initial={false}>
              <SwipeCard
                key={current.id}
                paper={current}
                inNiche={niche.ready && nicheAffinity(current.categories, niche) > 0}
                onDecide={decide}
                getExitDirection={getExitDirection}
              />
            </AnimatePresence>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-white/60 p-8 text-center">
              <p className="text-lg font-semibold text-gray-900">You&apos;ve seen every paper in the deck</p>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Pull in fresh abstracts from arXiv, or go discuss the papers you picked.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  onClick={fetchMore}
                  disabled={fetchingMore}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-light disabled:opacity-50"
                >
                  {fetchingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                  {fetchingMore ? 'Fetching from arXiv...' : 'Fetch more from arXiv'}
                </button>
                <Link
                  href="/discussions"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Review your picks <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {fetchError && <p className="mt-3 text-sm text-red-600">{fetchError}</p>}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-5 flex items-center justify-center gap-5">
          <button
            onClick={undo}
            disabled={history.length === 0}
            aria-label="Undo last swipe"
            title="Undo (Z)"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:text-gray-900 disabled:opacity-40"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => decide(false)}
            disabled={!current}
            aria-label="Skip"
            title="Skip (←)"
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-rose-200 bg-white text-rose-500 shadow-md transition hover:scale-105 hover:border-rose-400 active:scale-95 disabled:opacity-40"
          >
            <X className="h-8 w-8" />
          </button>
          <button
            onClick={() => decide(true)}
            disabled={!current}
            aria-label="Interested"
            title="Interested (→)"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:scale-105 hover:bg-primary-light active:scale-95 disabled:opacity-40"
          >
            <Heart className="h-8 w-8" />
          </button>
          <span className="hidden w-11 text-center text-xs tabular-nums text-gray-400 sm:block">
            {current ? `${index + 1}/${papers.length}` : ''}
          </span>
        </div>
        <p className="mt-3 hidden text-center text-xs text-gray-400 sm:block">
          Drag the card, or use ← skip · → interested · Z undo
        </p>

        {lastPick && (
          <div className="mx-auto mt-4 flex max-w-xl items-center gap-3 rounded-xl border border-primary/20 bg-primary-50 px-4 py-3 text-sm">
            <Heart className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-gray-800">
              Picked <strong className="font-semibold">{lastPick.title}</strong>
            </span>
            <Link
              href={`/paper/${lastPick.id}#discussion`}
              className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline"
            >
              <MessagesSquare className="h-4 w-4" /> Discuss
            </Link>
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <NichePanel niche={niche} />
      </aside>
    </div>
  )
}
