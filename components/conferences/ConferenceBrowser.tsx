'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ArrowLeft, ArrowRight, Bookmark, BookmarkPlus, CalendarPlus, ExternalLink, Search } from 'lucide-react'
import { buildIcs, downloadIcs } from '@/lib/ics'
import { CONFERENCES, CONFERENCE_CATEGORIES } from '@/lib/conferences'
import { eventEnd, eventStart, firstDeadline, nextEdition } from '@/lib/event-dates'

const label = (c: string) => (c === 'all' ? 'All fields' : c === 'NLP' || c === 'HCI' ? c : c[0].toUpperCase() + c.slice(1))

type Item = (typeof CONFERENCES)[number] & { start: Date | null; end: Date | null; due: Date | null }

export function ConferenceBrowser({ mode }: { mode: 'upcoming' | 'past' }) {
  const [query, setQuery] = useState('')
  const [field, setField] = useState('all')
  const [watch, setWatch] = useState<string[]>([])
  const [savedOnly, setSavedOnly] = useState(false)
  const [sort, setSort] = useState<'deadline' | 'date'>('deadline')
  // Today's date only exists in the browser; reading it during the server render breaks hydration.
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    // restore the watchlist and any filters in the link
    try {
      setWatch(JSON.parse(localStorage.getItem('conf-watch') || '[]'))
    } catch {}
    const sp = new URLSearchParams(window.location.search)
    setQuery(sp.get('q') ?? '')
    if (CONFERENCE_CATEGORIES.includes(sp.get('field') ?? '')) setField(sp.get('field')!)
  }, [])

  // keep filters in the URL so a filtered view can be shared
  useEffect(() => {
    const sp = new URLSearchParams()
    if (query) sp.set('q', query)
    if (field !== 'all') sp.set('field', field)
    const qs = sp.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }, [query, field])

  const items = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase()
    return CONFERENCES.filter((c) => field === 'all' || c.category === field)
      .filter((c) => !q || `${c.name} ${c.where} ${c.category}`.toLowerCase().includes(q))
      .filter((c) => !savedOnly || watch.includes(c.name))
      .map((c) => ({ ...c, start: eventStart(c.when), end: eventEnd(c.when), due: firstDeadline(c.deadline) }))
  }, [query, field, savedOnly, watch])

  const title = mode === 'upcoming' ? 'Conferences' : 'Past conferences'

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {mode === 'past' && (
          <Link href="/conferences" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back to upcoming
          </Link>
        )}
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">{title}</h1>
      </div>
      {mode === 'upcoming' && (
        <Link href="/conferences/past" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Past conferences <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )

  if (!now) return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{header}</div>

  const isPast = (c: Item) => Boolean(c.end && c.end < now)
  const daysTo = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / 86400000)
  const inf = (d: Date | null) => d?.getTime() ?? Infinity

  const upcoming = items.filter((c) => !isPast(c))
  const open = upcoming.filter((c) => c.due && daysTo(c.due) >= 0).sort((a, b) => a.due!.getTime() - b.due!.getTime())
  const byDate = (a: Item, b: Item) => inf(a.start) - inf(b.start)
  if (sort === 'date') open.sort(byDate)
  const rest = upcoming.filter((c) => !open.includes(c)).sort(byDate)
  const past = items.filter(isPast).sort((a, b) => b.end!.getTime() - a.end!.getTime())

  const toggle = (n: string) =>
    setWatch((w) => {
      const next = w.includes(n) ? w.filter((x) => x !== n) : [...w, n]
      try {
        localStorage.setItem('conf-watch', JSON.stringify(next))
      } catch {}
      return next
    })

  // .ics with the submission deadline (if still ahead) and the event itself (if it has exact days)
  const addToCalendar = (c: Item) => {
    const entries = []
    if (c.due && daysTo(c.due) >= 0) {
      entries.push({ uid: `${c.name}-deadline`, title: `${c.name}: submission deadline`, start: c.due, url: c.url, note: 'Check the official site for the exact time and time zone.' })
    }
    if (c.start && c.end && /\d{1,2}/.test(c.when)) {
      entries.push({ uid: `${c.name}-event`, title: c.name, start: c.start, end: c.end, url: c.url, note: c.where })
    }
    if (entries.length) downloadIcs(`${c.name.replace(/[^\w]+/g, '-')}.ics`, buildIcs(entries))
  }
  const when = (c: Item) => `${c.approx ? '~' : ''}${c.when}`

  const Save = ({ name }: { name: string }) => (
    <button
      onClick={() => toggle(name)}
      className={`rounded-lg p-2 transition ${watch.includes(name) ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-100'}`}
      aria-label={watch.includes(name) ? 'Remove from watchlist' : 'Add to watchlist'}
      title={watch.includes(name) ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {watch.includes(name) ? <Bookmark className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
    </button>
  )

  const Deadline = ({ c }: { c: Item }) => {
    if (!c.due) return <span className="text-sm text-gray-600">{c.deadline}</span>
    const d = daysTo(c.due)
    if (d < 0) return <span className="text-sm text-gray-400">Submissions closed</span>
    return (
      <span className="flex flex-col text-sm text-gray-700">
        {format(c.due, 'd MMM yyyy')}
        <span className={`text-xs font-medium ${d <= 14 ? 'text-amber-700' : 'text-emerald-700'}`}>
          {d === 0 ? 'closes today' : `${d} day${d === 1 ? '' : 's'} left`}
        </span>
      </span>
    )
  }

  // One grid for every row so the columns line up.
  const ROW = 'grid items-center gap-x-4 gap-y-1 px-4 py-3.5 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'

  const Row = ({ c }: { c: Item }) => (
    <li className={ROW}>
      <div className="min-w-0">
        <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
          <span className="truncate">{c.name}</span> <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </a>
        <p className="truncate text-xs text-gray-500">{label(c.category)}</p>
      </div>
      <div className="text-sm text-gray-700" title={c.approx ? 'Estimated from the previous edition' : undefined}>
        {when(c)}
        <span className="block truncate text-xs text-gray-500">{c.where}</span>
      </div>
      <div><Deadline c={c} /></div>
      <div className="flex justify-self-end">
        <button
          onClick={() => addToCalendar(c)}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
          aria-label={`Add ${c.name} to calendar`}
          title="Add to calendar (.ics)"
        >
          <CalendarPlus className="h-4 w-4" />
        </button>
        <Save name={c.name} />
      </div>
    </li>
  )

  const PastRow = ({ c }: { c: Item }) => {
    const next = nextEdition(c, CONFERENCES)
    return (
      <li className={ROW}>
        <div className="min-w-0">
          <span className="block truncate font-medium text-gray-800">{c.name}</span>
          <p className="truncate text-xs text-gray-500">{label(c.category)}</p>
        </div>
        <div className="text-sm text-gray-700">
          {when(c)}
          <span className="block truncate text-xs text-gray-500">{c.where}</span>
        </div>
        <div className="text-sm text-gray-700">
          {next && 'known' in next ? (
            <a href={next.known.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              Next: {next.known.when}
            </a>
          ) : next ? (
            <>Next: around {next.expected}</>
          ) : (
            'Next: see site'
          )}
        </div>
        <a href={c.url} target="_blank" rel="noopener noreferrer" className="justify-self-end whitespace-nowrap text-sm font-medium text-primary hover:underline">
          Papers & recordings
        </a>
      </li>
    )
  }

  const List = ({ children }: { children: React.ReactNode }) => (
    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">{children}</ul>
  )
  const Heading = ({ children, n }: { children: React.ReactNode; n: number }) => (
    <h2 className="mb-2 mt-7 flex items-baseline gap-2 text-sm font-semibold text-gray-900">
      {children} <span className="font-normal text-gray-400">{n}</span>
    </h2>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {header}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or place"
            aria-label="Search conferences"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          aria-label="Field"
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary sm:w-52"
        >
          {CONFERENCE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{label(c)}</option>
          ))}
        </select>
      </div>

      {mode === 'upcoming' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button
            onClick={() => setSavedOnly((v) => !v)}
            aria-pressed={savedOnly}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${savedOnly ? 'bg-primary text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-primary'}`}
          >
            <Bookmark className="h-3.5 w-3.5" /> Saved {watch.length > 0 && <span className="opacity-70">{watch.length}</span>}
          </button>
          <span className="ml-auto flex items-center gap-1.5 text-gray-500">
            Order open ones by
            <select value={sort} onChange={(e) => setSort(e.target.value as 'deadline' | 'date')} aria-label="Order" className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800">
              <option value="deadline">deadline</option>
              <option value="date">event date</option>
            </select>
          </span>
        </div>
      )}

      {mode === 'upcoming' ? (
        <>
          {open.length > 0 && (
            <>
              <Heading n={open.length}>Open for submissions</Heading>
              <List>{open.map((c) => <Row key={c.name} c={c} />)}</List>
            </>
          )}
          {rest.length > 0 && (
            <>
              <Heading n={rest.length}>{open.length ? 'Also coming up' : 'Coming up'}</Heading>
              <List>{rest.map((c) => <Row key={c.name} c={c} />)}</List>
            </>
          )}
          {!open.length && !rest.length && (
            <p className="mt-8 text-sm text-gray-600">{savedOnly ? 'Nothing saved yet. Tap the bookmark on a conference to keep it here.' : 'No conferences match.'}</p>
          )}
        </>
      ) : past.length ? (
        <div className="mt-6"><List>{past.map((c) => <PastRow key={c.name} c={c} />)}</List></div>
      ) : (
        <p className="mt-8 text-sm text-gray-600">No past conferences match.</p>
      )}
    </div>
  )
}
