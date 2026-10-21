'use client'

import { ExternalLink, BookmarkPlus, Bookmark } from 'lucide-react'
import { useState } from 'react'
import { eventEnd, eventStart, firstDeadline } from '@/lib/event-dates'

type Conference = {
  name: string
  when: string
  where: string
  deadline: string
  url: string
  category: string
}

export default function ConferencesPage() {
  const [savedConferences, setSavedConferences] = useState<string[]>([])
  const [filter, setFilter] = useState<string>('all')

  const toggleSave = (confName: string) => {
    setSavedConferences(prev => 
      prev.includes(confName) 
        ? prev.filter(c => c !== confName)
        : [...prev, confName]
    )
  }

  const conferences: Conference[] = [
    // Machine Learning & AI
    {
      name: 'NeurIPS 2026',
      when: 'Dec 6-12, 2026',
      where: 'Vancouver, Canada',
      deadline: 'May 16, 2026',
      url: 'https://neurips.cc/',
      category: 'machine learning',
    },
    {
      name: 'ICML 2026',
      when: 'Jul 12-18, 2026',
      where: 'Vienna, Austria',
      deadline: 'Feb 2, 2026',
      url: 'https://icml.cc/',
      category: 'machine learning',
    },
    {
      name: 'ICLR 2027',
      when: 'May 3-7, 2027',
      where: 'Kigali, Rwanda',
      deadline: 'Sep 28, 2026 (Oct 5, 2026)',
      url: 'https://iclr.cc/',
      category: 'machine learning',
    },
    {
      name: 'AAAI 2027',
      when: 'Feb 22-Mar 2, 2027',
      where: 'San Francisco, USA',
      deadline: 'Aug 8, 2026 (Aug 15, 2026)',
      url: 'https://aaai.org/aaai-conference/',
      category: 'artificial intelligence',
    },
    {
      name: 'IJCAI 2026',
      when: 'Aug 22-29, 2026',
      where: 'Jeju, South Korea',
      deadline: 'Jan 15, 2026 (Jan 22, 2026)',
      url: 'https://www.ijcai.org/',
      category: 'artificial intelligence',
    },
    
    // Computer Vision
    {
      name: 'CVPR 2026',
      when: 'Jun 14-19, 2026',
      where: 'Seattle, USA',
      deadline: 'Nov 15, 2025',
      url: 'https://cvpr.thecvf.com/',
      category: 'computer vision',
    },
    {
      name: 'ICCV 2027',
      when: 'Oct 10-17, 2027',
      where: 'Montreal, Canada',
      deadline: 'Mar 10, 2027',
      url: 'https://iccv2027.thecvf.com/',
      category: 'computer vision',
    },
    {
      name: 'ECCV 2026',
      when: 'Sep 6-12, 2026',
      where: 'Milan, Italy',
      deadline: 'Mar 7, 2026',
      url: 'https://eccv2026.ecva.net/',
      category: 'computer vision',
    },
    {
      name: 'WACV 2027',
      when: 'Jan 4-8, 2027',
      where: 'Hawaii, USA',
      deadline: 'Jul 15, 2026',
      url: 'https://wacv2027.thecvf.com/',
      category: 'computer vision',
    },
    
    // NLP
    {
      name: 'ACL 2026',
      when: 'Jul 26-31, 2026',
      where: 'Bangkok, Thailand',
      deadline: 'Feb 15, 2026',
      url: 'https://2026.aclweb.org/',
      category: 'NLP',
    },
    {
      name: 'EMNLP 2026',
      when: 'Nov 8-12, 2026',
      where: 'Abu Dhabi, UAE',
      deadline: 'Jun 1, 2026',
      url: 'https://2026.emnlp.org/',
      category: 'NLP',
    },
    {
      name: 'NAACL 2027',
      when: 'Jun 6-11, 2027',
      where: 'Toronto, Canada',
      deadline: 'Dec 15, 2026',
      url: 'https://2027.naacl.org/',
      category: 'NLP',
    },
    {
      name: 'COLING 2026',
      when: 'Aug 17-22, 2026',
      where: 'Seoul, South Korea',
      deadline: 'Apr 20, 2026',
      url: 'https://coling2026.org/',
      category: 'NLP',
    },
    
    // Robotics
    {
      name: 'ICRA 2026',
      when: 'May 18-22, 2026',
      where: 'Philadelphia, USA',
      deadline: 'Sep 15, 2025',
      url: 'https://2026.ieee-icra.org/',
      category: 'robotics',
    },
    {
      name: 'IROS 2026',
      when: 'Oct 4-8, 2026',
      where: 'Prague, Czech Republic',
      deadline: 'Mar 1, 2026',
      url: 'https://iros2026.org/',
      category: 'robotics',
    },
    {
      name: 'CoRL 2026',
      when: 'Nov 15-18, 2026',
      where: 'Singapore',
      deadline: 'Jun 20, 2026',
      url: 'https://www.robot-learning.org/',
      category: 'robotics',
    },
    {
      name: 'RSS 2026',
      when: 'Jul 12-16, 2026',
      where: 'Ann Arbor, USA',
      deadline: 'Jan 31, 2026',
      url: 'https://roboticsconference.org/',
      category: 'robotics',
    },
    
    // HCI
    {
      name: 'CHI 2026',
      when: 'May 9-14, 2026',
      where: 'Boston, USA',
      deadline: 'Sep 15, 2025',
      url: 'https://chi2026.acm.org/',
      category: 'HCI',
    },
    {
      name: 'UIST 2026',
      when: 'Oct 11-14, 2026',
      where: 'Tokyo, Japan',
      deadline: 'Apr 1, 2026',
      url: 'https://uist.acm.org/2026/',
      category: 'HCI',
    },
    {
      name: 'IUI 2027',
      when: 'Mar 23-26, 2027',
      where: 'Sydney, Australia',
      deadline: 'Oct 1, 2026',
      url: 'https://iui.acm.org/2027/',
      category: 'HCI',
    },
    
    // Workshops
    {
      name: 'NeurIPS Workshops 2026',
      when: 'Dec 13-14, 2026',
      where: 'Vancouver, Canada',
      deadline: 'Sep-Oct 2026',
      url: 'https://neurips.cc/',
      category: 'workshops',
    },
    {
      name: 'ICML Workshops 2026',
      when: 'Jul 19, 2026',
      where: 'Vienna, Austria',
      deadline: 'Apr-May 2026',
      url: 'https://icml.cc/',
      category: 'workshops',
    },
    {
      name: 'ICLR Workshops 2027',
      when: 'May 8, 2027',
      where: 'Kigali, Rwanda',
      deadline: 'Feb-Mar 2027',
      url: 'https://iclr.cc/',
      category: 'workshops',
    },
  ]

  const categories = ['all', 'machine learning', 'artificial intelligence', 'computer vision', 'NLP', 'robotics', 'HCI', 'workshops']

  // Work out from today's date what is upcoming and which deadlines are still open.
  const now = new Date()
  const dated = conferences
    .filter((c) => filter === 'all' || c.category === filter)
    .map((c) => ({ ...c, start: eventStart(c.when), end: eventEnd(c.when), due: firstDeadline(c.deadline) }))
  const upcoming = dated
    .filter((c) => !c.end || c.end >= now)
    .sort((a, b) => (a.start?.getTime() ?? Infinity) - (b.start?.getTime() ?? Infinity))
  const past = dated.filter((c) => c.end && c.end < now).sort((a, b) => b.end!.getTime() - a.end!.getTime())

  const deadlineBadge = (due: Date | null, text: string) => {
    if (!due) return <span className="text-sm text-gray-600">{text}</span>
    const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
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

  const Row = ({ conf }: { conf: (typeof dated)[number] }) => (
    <li className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 flex-1">
        <a href={conf.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
          {conf.name} <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="mt-0.5 text-sm text-gray-600">
          {conf.when} · {conf.where}
        </p>
      </div>
      <div className="sm:w-72">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Deadline</p>
        {deadlineBadge(conf.due, conf.deadline)}
      </div>
      <button
        onClick={() => toggleSave(conf.name)}
        className={`self-start rounded-lg p-2 transition sm:self-center ${
          savedConferences.includes(conf.name) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={savedConferences.includes(conf.name) ? 'Remove from watchlist' : 'Add to watchlist'}
        aria-label={savedConferences.includes(conf.name) ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {savedConferences.includes(conf.name) ? <Bookmark className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
      </button>
    </li>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-primary-dark sm:text-3xl">Conferences & deadlines</h1>
      <p className="mt-1 text-gray-600">Upcoming conferences and workshops, sorted by date. Past events are tucked away automatically.</p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Dates and locations are compiled by hand and can change. Always confirm on the official site before planning.
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

      <h2 className="mt-6 text-sm font-medium text-gray-500">Upcoming · {upcoming.length}</h2>
      {upcoming.length ? (
        <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {upcoming.map((c) => (
            <Row key={c.name} conf={c} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600">
          Nothing upcoming in this list. Next editions are added once their dates are announced.
        </p>
      )}

      {past.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-gray-500">Past events · {past.length}</summary>
          <ul className="mt-2 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white opacity-70">
            {past.map((c) => (
              <Row key={c.name} conf={c} />
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
