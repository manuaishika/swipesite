'use client'

import { ExternalLink, BookmarkPlus, Bookmark } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { CONFERENCES, CONFERENCE_CATEGORIES } from '@/lib/conferences'
import { eventEnd, eventStart, firstDeadline, nextEdition } from '@/lib/event-dates'

export default function ConferencesPage() {
  const [savedConferences, setSavedConferences] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  const toggleSave = (confName: string) => {
    setSavedConferences(prev => 
      prev.includes(confName) 
        ? prev.filter(c => c !== confName)
        : [...prev, confName]
    )
  }

  const conferences = CONFERENCES
  const categories = CONFERENCE_CATEGORIES

  // Everything below is worked out from today's date, so nothing needs editing as time passes.
  const now = new Date()
  const dated = conferences
    .filter((c) => filter === 'all' || c.category === filter)
    .map((c) => ({ ...c, start: eventStart(c.when), end: eventEnd(c.when), due: firstDeadline(c.deadline) }))
  const isPast = (c: (typeof dated)[number]) => Boolean(c.end && c.end < now)
  const upcoming = dated
    .filter((c) => !isPast(c))
    .sort((a, b) => (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity))
  const past = dated.filter(isPast).sort((a, b) => b.end!.getTime() - a.end!.getTime())
  const daysTo = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / 86400000)
  // important: submission deadlines that are still open, nearest first
  const closingSoon = upcoming
    .filter((c) => c.due && daysTo(c.due) >= 0 && daysTo(c.due) <= 45)
    .sort((a, b) => a.due!.getTime() - b.due!.getTime())

  const deadlineBadge = (due: Date | null, text: string) => {
    if (!due) return <span className="text-sm text-gray-600">{text}</span>
    const days = daysTo(due)
    if (days < 0) return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Submissions closed</span>
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-sm text-gray-700">
        {text}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${days <= 14 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
          {days === 0 ? 'closes today' : `closes in ${days} day${days === 1 ? '' : 's'}`}
        </span>
      </span>
    )
  }

  const Save = ({ name }: { name: string }) => (
    <button
      onClick={() => toggleSave(name)}
      className={`self-start rounded-lg p-2 transition sm:self-center ${
        savedConferences.includes(name) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={savedConferences.includes(name) ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-label={savedConferences.includes(name) ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {savedConferences.includes(name) ? <Bookmark className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
    </button>
  )

  const Row = ({ conf }: { conf: (typeof dated)[number] }) => (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <a href={conf.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
          {conf.name} <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="mt-0.5 text-sm text-gray-600">
          {conf.approx ? '~' : ''}{conf.when} · {conf.where}
        </p>
      </div>
      <div className="sm:w-72">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Deadline</p>
        {deadlineBadge(conf.due, conf.deadline)}
      </div>
      <Save name={conf.name} />
    </li>
  )

  // Past event: what it was, and when the next one is (announced, or expected).
  const PastRow = ({ conf }: { conf: (typeof dated)[number] }) => {
    const next = nextEdition(conf, conferences)
    return (
      <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <span className="font-medium text-gray-700">{conf.name}</span>
          <p className="mt-0.5 text-sm text-gray-500">
            Took place {conf.approx ? '~' : ''}{conf.when} · {conf.where}
          </p>
        </div>
        <div className="sm:w-80">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Next edition</p>
          {next && 'known' in next ? (
            <a href={next.known.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
              {next.known.name}: {next.known.when}
            </a>
          ) : next ? (
            <span className="block text-sm text-gray-700">
              Expected around {next.expected}
              <span className="mt-0.5 block text-xs text-gray-500">Not announced yet</span>
            </span>
          ) : (
            <span className="text-sm text-gray-500">Check the official site</span>
          )}
        </div>
        <a href={conf.url} target="_blank" rel="noopener noreferrer" className="self-start rounded-lg p-2 text-gray-500 hover:bg-gray-100 sm:self-center" aria-label="Official site">
          <ExternalLink className="h-4 w-4" />
        </a>
      </li>
    )
  }

  const tabBtn = (id: 'upcoming' | 'past', label: string, n: number) => (
    <button
      onClick={() => setTab(id)}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === id ? 'bg-primary text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-primary'}`}
    >
      {label} <span className={tab === id ? 'text-white/70' : 'text-gray-400'}>{n}</span>
    </button>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-primary-dark sm:text-3xl">Conferences & deadlines</h1>
      <p className="mt-1 text-gray-600">
        Today is {format(now, 'd MMMM yyyy')}. Only events that haven&apos;t happened yet are listed first; finished ones are in their own tab with the next edition.
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Dates and locations are compiled by hand and can change. Always confirm on the official site before planning. A ~ means the dates are estimated from the previous edition.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filter === cat ? 'bg-primary text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-primary'
            }`}
          >
            {cat === 'all' ? 'All' : cat === 'NLP' || cat === 'HCI' ? cat : cat[0].toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        {tabBtn('upcoming', 'Upcoming', upcoming.length)}
        {tabBtn('past', 'Already happened', past.length)}
      </div>

      {tab === 'upcoming' ? (
        <>
          {closingSoon.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-medium text-gray-500">Deadlines closing soon</h2>
              <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                {closingSoon.slice(0, 4).map((c) => (
                  <li key={c.name} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      {c.name}
                    </a>
                    <p className="mt-1 text-sm text-gray-700">Submissions close {format(c.due!, 'd MMM yyyy')}</p>
                    <p className="text-sm font-medium text-amber-900">in {daysTo(c.due!)} day{daysTo(c.due!) === 1 ? '' : 's'}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <h2 className="mt-6 text-sm font-medium text-gray-500">By date · {upcoming.length}</h2>
          {upcoming.length ? (
            <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {upcoming.map((c) => (
                <Row key={c.name} conf={c} />
              ))}
            </ul>
          ) : (
            <p className="mt-2 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600">
              Nothing upcoming in this category. See &ldquo;Already happened&rdquo; for when the next editions are expected.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-6 text-sm text-gray-600">These have already taken place. Next editions are shown once announced; otherwise the usual time of year.</p>
          {past.length ? (
            <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {past.map((c) => (
                <PastRow key={c.name} conf={c} />
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600">Nothing has finished yet in this category.</p>
          )}
        </>
      )}
    </div>
  )
}
