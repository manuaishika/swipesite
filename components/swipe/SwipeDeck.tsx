'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Heart, Loader2, MessagesSquare, PartyPopper, RotateCcw, X } from 'lucide-react'
import { applySwipe, categoryEvidence, emptyTally, nicheFromTally, type NicheTally } from '@/lib/niche-core'
import { readGuestSaves, readGuestSwipes, writeGuestSaves, writeGuestSwipes, type GuestSwipe } from '@/lib/guest-swipes'
import { NichePanel } from './NichePanel'
import { StackedCard, SwipeCard, type SwipePaper } from './SwipeCard'

type Paper = SwipePaper & { keywords: string[] }

type Props = {
  initialPapers: Paper[]
  initialTally: NicheTally
  /** Tags of papers in the deck the user already saved for later (logged-in users). */
  initialSaved?: Record<string, string[]>
  /** Guest mode: no account; swipes stay in this browser until sign-up. */
  guest?: boolean
}

export function SwipeDeck({ initialPapers, initialTally, initialSaved = {}, guest = false }: Props) {
  const [papers, setPapers] = useState(initialPapers)
  const [index, setIndex] = useState(0)
  const [tally, setTally] = useState(initialTally)
  const [history, setHistory] = useState<{ paper: Paper; liked: boolean }[]>([])
  const [returnFrom, setReturnFrom] = useState(0)
  const [lastPick, setLastPick] = useState<Paper | null>(null)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saved, setSaved] = useState<Record<string, string[]>>(initialSaved)
  const flingRef = useRef<((liked: boolean) => void) | null>(null)
  const registerFling = useCallback((f: ((liked: boolean) => void) | null) => {
    flingRef.current = f
  }, [])

  const niche = useMemo(() => nicheFromTally(tally), [tally])
  const current = papers[index]

  // Guest: restore swipes from this browser and drop already-swiped papers from the deck.
  useEffect(() => {
    if (!guest) return
    setSaved(Object.fromEntries(readGuestSaves().map((g) => [g.paperId, g.tags])))
    const saved = readGuestSwipes()
    if (!saved.length) return
    const done = new Set(saved.map((s) => s.paperId))
    const t = saved.reduce((acc, s) => applySwipe(acc, s), emptyTally())
    setTally(t)
    setPapers((prev) => prev.filter((p) => !done.has(p.id)))
  }, [guest])

  const fetchMore = useCallback(async () => {
    if (fetchingMore || guest) return
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
  }, [fetchingMore, guest])

  // Runs after the card has flown off screen.
  const commit = useCallback(
    (liked: boolean) => {
      const paper = papers[index]
      if (!paper) return
      const swipe: GuestSwipe = { paperId: paper.id, liked, categories: paper.categories, keywords: paper.keywords, title: paper.title }
      setReturnFrom(0)
      setIndex((i) => i + 1)
      setTally((t) => applySwipe(t, swipe))
      setHistory((h) => [...h, { paper, liked }])
      setLastPick(liked ? paper : null)

      if (guest) {
        writeGuestSwipes([...readGuestSwipes().filter((s) => s.paperId !== paper.id), swipe])
      } else {
        // The like route upserts, so a re-decision after undo simply overwrites it.
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
      }
    },
    [papers, index, guest, fetchMore]
  )

  const decide = useCallback(
    (liked: boolean) => {
      if (!papers[index]) return
      if (flingRef.current) flingRef.current(liked)
      else commit(liked)
    },
    [papers, index, commit]
  )

  // Save for later (with tags) without rating the paper; tags === null removes it.
  const savePaper = useCallback(
    (paper: Paper, tags: string[] | null) => {
      setSaved((cur) => {
        const next = { ...cur }
        if (tags) next[paper.id] = tags
        else delete next[paper.id]
        return next
      })
      if (guest) {
        const rest = readGuestSaves().filter((g) => g.paperId !== paper.id)
        writeGuestSaves(tags ? [...rest, { paperId: paper.id, title: paper.title, tags }] : rest)
      } else {
        fetch('/api/papers/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId: paper.id, saved: Boolean(tags), tags: tags ?? undefined }),
        }).catch((e) => console.error('Error saving paper:', e))
      }
    },
    [guest]
  )

  const undo = useCallback(() => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    setTally((t) => applySwipe(t, { liked: last.liked, categories: last.paper.categories, keywords: last.paper.keywords }, -1))
    setReturnFrom(last.liked ? 1 : -1)
    setIndex((i) => i - 1)
    setLastPick(null)
    if (guest) writeGuestSwipes(readGuestSwipes().filter((s) => s.paperId !== last.paper.id))
  }, [history, guest])

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

  useEffect(() => {
    if (!lastPick) return
    const id = setTimeout(() => setLastPick(null), 6000)
    return () => clearTimeout(id)
  }, [lastPick])

  const discussHref = (id: string) => (guest ? '/register' : `/paper/${id}#discussion`)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        {guest && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary-50 px-3 py-2 text-xs sm:mb-4 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <span className="text-gray-800">
              <strong className="font-medium">Rating as a guest.</strong>
              <span className="hidden sm:inline"> Your ratings are kept in this browser. Sign up to keep them and join discussions.</span>
            </span>
            <Link href="/register" className="shrink-0 rounded-lg bg-primary px-3 py-1.5 font-medium text-white hover:bg-primary-light">
              Sign up
            </Link>
          </div>
        )}

        <div className="relative mx-auto h-[calc(100svh-17rem)] min-h-[24rem] max-h-[36rem] max-w-2xl sm:h-[36rem]">
          {current ? (
            <>
              {papers[index + 2] && <StackedCard key={papers[index + 2].id + '-2'} paper={papers[index + 2]} depth={2} />}
              {papers[index + 1] && <StackedCard key={papers[index + 1].id + '-1'} paper={papers[index + 1]} depth={1} />}
              <SwipeCard
                key={current.id}
                paper={current}
                evidence={categoryEvidence(current.categories[0], niche)}
                onDecide={commit}
                registerFling={registerFling}
                returnFrom={returnFrom}
                savedTags={saved[current.id] ?? null}
                onSave={(tags) => savePaper(current, tags)}
              />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-gray-300 bg-white/60 p-8 text-center">
              <PartyPopper className="h-10 w-10 text-primary" />
              <p className="mt-3 text-xl font-semibold text-gray-900">You swiped the whole deck!</p>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                {guest
                  ? 'Sign up to keep your ratings, get fresh papers and review the ones you picked.'
                  : 'Pull in fresh abstracts from arXiv, or go discuss the papers you picked.'}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {guest ? (
                  <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-light">
                    Save my progress <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={fetchMore}
                      disabled={fetchingMore}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-light disabled:opacity-50"
                    >
                      {fetchingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                      {fetchingMore ? 'Fetching from arXiv...' : 'Fetch more from arXiv'}
                    </button>
                    <Link
                      href="/discussions"
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Review your picks <ArrowRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </div>
              {fetchError && <p className="mt-3 text-sm text-red-600">{fetchError}</p>}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-6 flex items-center justify-center gap-4 sm:mt-8 sm:gap-7">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={undo}
            disabled={history.length === 0}
            aria-label="Undo last swipe"
            title="Undo (Z)"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-amber-500 shadow-md transition hover:scale-110 disabled:opacity-40 disabled:hover:scale-100"
          >
            <RotateCcw className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => decide(false)}
            disabled={!current}
            aria-label="Skip"
            title="Skip (←)"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-rose-200 sm:h-16 sm:w-16 bg-white text-rose-500 shadow-lg transition hover:scale-110 hover:border-rose-400 hover:bg-rose-50 disabled:opacity-40"
          >
            <X className="h-7 w-7" strokeWidth={2.5} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => decide(true)}
            disabled={!current}
            aria-label="Interested"
            title="Interested (→)"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br sm:h-16 sm:w-16 from-emerald-400 to-primary text-white shadow-lg shadow-primary/30 transition hover:scale-110 disabled:opacity-40"
          >
            <Heart className="h-7 w-7 fill-current" />
          </motion.button>
          <span className="flex h-12 w-12 items-center justify-center text-xs font-semibold tabular-nums text-gray-400">
            {current ? `${index + 1}/${papers.length}` : ''}
          </span>
        </div>
        <p className="mt-3 hidden text-center text-xs text-gray-400 sm:block">
          Drag the card, or press <kbd className="rounded border px-1">←</kbd> skip · <kbd className="rounded border px-1">→</kbd> interested ·{' '}
          <kbd className="rounded border px-1">Z</kbd> undo
        </p>

        <AnimatePresence>
          {lastPick && (
            <motion.div
              key={lastPick.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="mx-auto mt-5 flex max-w-xl items-center gap-3 rounded-2xl border border-primary/20 bg-primary-50 px-4 py-3 text-sm"
            >
              <Heart className="h-4 w-4 shrink-0 fill-current text-primary" />
              <span className="min-w-0 flex-1 truncate text-gray-800">
                Picked <strong className="font-semibold">{lastPick.title}</strong>
              </span>
              <Link href={discussHref(lastPick.id)} className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary hover:underline">
                <MessagesSquare className="h-4 w-4" /> {guest ? 'Sign up to discuss' : 'Discuss'}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <NichePanel niche={niche} guest={guest} />
      </aside>

    </div>
  )
}
