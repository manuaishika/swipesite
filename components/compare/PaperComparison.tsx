'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ExternalLink, MessagesSquare, ThumbsUp } from 'lucide-react'
import { keyPoints, displayKeywords } from '@/lib/abstract-points'
import { areaLabel } from '@/lib/niche-core'

export type ComparePaper = {
  id: string
  title: string
  abstract: string
  authors: string[]
  categories: string[]
  keywords: string[]
  published: string | null
  url: string | null
  interested: number
  posts: number
}

/** Pick two saved papers and read them side by side. Facts only: nothing here is scored or judged. */
export function PaperComparison({ papers }: { papers: ComparePaper[] }) {
  const [a, setA] = useState(papers[0]?.id ?? '')
  const [b, setB] = useState(papers[1]?.id ?? '')
  const pa = papers.find((p) => p.id === a)
  const pb = papers.find((p) => p.id === b)

  if (papers.length < 2)
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white/60 p-8 text-center text-gray-600">
        Save at least two papers to compare them. Tap Save on any abstract while swiping.
        <div className="mt-4">
          <Link href="/swipe" className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">Rate abstracts</Link>
        </div>
      </div>
    )

  const pick = (value: string, set: (v: string) => void, other: string, label: string) => (
    <select value={value} onChange={(e) => set(e.target.value)} aria-label={label} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm">
      {papers.map((p) => (
        <option key={p.id} value={p.id} disabled={p.id === other}>{p.title}</option>
      ))}
    </select>
  )

  return (
    <div className="mt-6">
      <div className="grid gap-3 md:grid-cols-2">
        {pick(a, setA, b, 'First paper')}
        {pick(b, setB, a, 'Second paper')}
      </div>
      {pa && pb && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Side p={pa} />
          <Side p={pb} />
        </div>
      )}
    </div>
  )
}

function Side({ p }: { p: ComparePaper }) {
  const points = useMemo(() => keyPoints(p.abstract), [p.abstract])
  const kws = displayKeywords(p.keywords, 6)
  return (
    <article className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs text-gray-500">
        {p.categories[0] ? areaLabel(p.categories[0]) : 'Uncategorised'}
        {p.published && ` · ${new Date(p.published).getFullYear()}`}
      </p>
      <h2 className="mt-1 font-semibold leading-snug text-gray-900">{p.title}</h2>
      <p className="mt-1 truncate text-xs text-gray-500">{p.authors.slice(0, 4).join(', ')}{p.authors.length > 4 ? ` +${p.authors.length - 4}` : ''}</p>

      <dl className="mt-4 space-y-3">
        {points.map((k) => (
          <div key={k.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{k.label}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-gray-800">{k.text}</dd>
          </div>
        ))}
      </dl>

      {kws.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {kws.map((k) => (
            <span key={k} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">{k}</span>
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5" title="People here who marked it interesting"><ThumbsUp className="h-4 w-4" /> {p.interested}</span>
        <Link href={`/paper/${p.id}#discussion`} className="inline-flex items-center gap-1.5 hover:text-primary"><MessagesSquare className="h-4 w-4" /> {p.posts} post{p.posts === 1 ? '' : 's'}</Link>
        {p.url && (
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 font-medium text-primary hover:underline">
            arXiv <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  )
}
