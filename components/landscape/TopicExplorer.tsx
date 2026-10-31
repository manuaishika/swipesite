'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Loader2, Search, Users } from 'lucide-react'
import { areaLabel } from '@/lib/niche-core'
import { fmt, fmtFull, pctSigned } from './scale'

type Window = { label: string; count: number }
type Result = {
  label: string
  data: { windows: Window[]; sample?: { size: number; authors: number; where: { code: string; n: number }[] } }
  home: { code: string; label: string; last12: number | null } | null
  all: number | null
}

// Same thresholds as nicheLevel() on the server.
const LEVELS = [
  { max: 30, label: 'Very niche', detail: 'A handful of papers a year. Room to own a topic.' },
  { max: 300, label: 'Niche', detail: 'A small community. You can read most of it.' },
  { max: 3000, label: 'Established', detail: 'An active area with its own venues and debates.' },
  { max: Infinity, label: 'Major area', detail: 'Huge and fast-moving. You will need a sub-niche.' },
]

function anonId() {
  try {
    return localStorage.getItem('rs-anon') ?? undefined
  } catch {
    return undefined
  }
}

export function TopicExplorer({ initial, suggestions }: { initial: string; suggestions: string[] }) {
  const [q, setQ] = useState(initial)
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [res, setRes] = useState<Result | null>(null)
  const ran = useRef(false)

  const run = useCallback(async (topic: string) => {
    if (!topic.trim()) return
    setQ(topic)
    setState('loading')
    setError('')
    window.history.replaceState(null, '', `/landscape/niche?q=${encodeURIComponent(topic)}`)
    for (let attempt = 0; attempt < 12; attempt++) {
      const r = await fetch('/api/research/topic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: topic, anonId: anonId() }) }).catch(() => null)
      if (r?.status === 202) {
        await new Promise((ok) => setTimeout(ok, 4000)) // another count is running; wait our turn
        continue
      }
      const d = await r?.json().catch(() => null)
      if (r?.ok && d?.data) {
        setRes(d)
        setState('done')
      } else {
        setError(d?.error ?? 'Something went wrong. Try again.')
        setState('error')
      }
      return
    }
    setError('arXiv is busy. Try again in a minute.')
    setState('error')
  }, [])

  useEffect(() => {
    if (initial && !ran.current) {
      ran.current = true
      run(initial)
    }
  }, [initial, run])

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run(q)
        }}
        className="rounded-2xl border border-gray-200 bg-white p-4"
      >
        <div className="flex gap-2">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. mechanistic interpretability"
              aria-label="Research topic"
              maxLength={80}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 outline-none focus:border-primary"
            />
          </label>
          <button disabled={state === 'loading' || !q.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            Measure
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500">Try:</span>
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => run(s)} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700 hover:bg-primary-50 hover:text-primary">
              {s}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">Use + to require two phrases, e.g. &ldquo;language model + economics&rdquo;.</p>
      </form>

      {state === 'loading' && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Counting &ldquo;{q}&rdquo; on arXiv, year by year. A new topic takes about 20 seconds; we ask arXiv politely.
        </div>
      )}
      {state === 'error' && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {state === 'done' && res && <TopicResult r={res} />}
    </div>
  )
}

function TopicResult({ r }: { r: Result }) {
  const wins = [...r.data.windows].reverse() // oldest first for the chart
  const now = r.data.windows[0]?.count ?? 0
  const prev = r.data.windows[1]?.count ?? 0
  const g = prev ? (now - prev) / prev : null
  const level = LEVELS.findIndex((l) => now < l.max)
  const max = Math.max(1, ...wins.map((w) => w.count))
  const sample = r.data.sample
  const homeShare = sample?.size && r.home ? (sample.where.find((w) => w.code === r.home!.code)?.n ?? 0) / sample.size : null

  return (
    <div className="space-y-6">
      {/* headline */}
      <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <p className="text-sm text-gray-500">&ldquo;{r.label}&rdquo;</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums text-gray-900">{fmtFull(now)}</p>
          <p className="text-sm text-gray-600">papers on arXiv in {r.data.windows[0]?.label}</p>
          {g !== null && <p className={`mt-1 text-sm font-medium ${g >= 0 ? 'text-primary' : 'text-orange-700'}`}>{pctSigned(g)} on the 12 months before</p>}
          {/* niche meter */}
          <div className="mt-5">
            <div className="flex gap-1" aria-hidden>
              {LEVELS.map((l, i) => (
                <span key={l.label} className={`h-2 flex-1 rounded-full ${i <= level ? 'bg-primary' : 'bg-gray-200'}`} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-gray-400">
              <span>Very niche</span>
              <span>Major area</span>
            </div>
            <p className="mt-2 font-medium text-gray-900">{LEVELS[level].label}</p>
            <p className="text-sm text-gray-600">{LEVELS[level].detail}</p>
          </div>
        </div>
        {/* yearly bars */}
        <div>
          <p className="text-xs font-medium text-gray-500">Papers per 12 months</p>
          <div className="mt-3 flex h-44 items-end gap-2 sm:gap-3">
            {wins.map((w, i) => (
              <div key={w.label} className="group relative flex h-full flex-1 flex-col justify-end" title={`${w.label}: ${fmtFull(w.count)} papers`}>
                {(i === wins.length - 1 || i === 0) && <span className="mb-1 text-center text-xs tabular-nums text-gray-700">{fmt(w.count)}</span>}
                <span className="mx-auto block w-full max-w-[44px] rounded-t bg-primary/80 transition group-hover:bg-primary" style={{ height: `${Math.max(2, (w.count / max) * 100)}%` }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs shadow group-hover:block">
                  {fmtFull(w.count)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2 sm:gap-3">
            {wins.map((w) => (
              <span key={w.label} className="flex-1 text-center text-[10px] leading-tight text-gray-500">{w.label.split(' – ')[1]}</span>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-gray-400">Each bar is the 12 months ending in that month.</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ladder */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-medium text-gray-900">How deep is it?</h2>
          <p className="mt-0.5 text-xs text-gray-500">Each level as a share of the one above.</p>
          <ol className="mt-4 space-y-4">
            {r.all ? <Rung label="All of arXiv" n={r.all} share={1} /> : null}
            {r.home?.last12 ? <Rung label={r.home.label} n={r.home.last12} share={r.all ? r.home.last12 / r.all : null} /> : null}
            <Rung
              label={`“${r.label}”`}
              n={now}
              share={r.home?.last12 && homeShare !== null ? Math.min(1, (now * homeShare) / r.home.last12) : r.all ? now / r.all : null}
              accent
            />
          </ol>
        </section>

        {/* where + who */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-medium text-gray-900">Where it&apos;s published</h2>
          <p className="mt-0.5 text-xs text-gray-500">arXiv category of the {sample?.size ?? 0} most recent papers.</p>
          <ul className="mt-4 space-y-2.5">
            {(sample?.where ?? []).map((w) => (
              <li key={w.code}>
                <div className="flex justify-between text-sm">
                  <span className="truncate text-gray-800">{areaLabel(w.code)} <span className="text-xs text-gray-400">{w.code}</span></span>
                  <span className="tabular-nums text-gray-500">{Math.round((w.n / (sample!.size || 1)) * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(w.n / (sample!.size || 1)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {sample && sample.authors > 0 && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <strong className="font-semibold">{fmtFull(sample.authors)}</strong> different people wrote the {sample.size} most recent papers.
              </span>
            </p>
          )}
        </section>
      </div>

      {r.home && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/swipe?focus=${encodeURIComponent(r.home.code)}&label=${encodeURIComponent(r.home.label)}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
          >
            Rate abstracts in {r.home.label} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/landscape" className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            See all areas
          </Link>
        </div>
      )}
    </div>
  )
}

function Rung({ label, n, share, accent = false }: { label: string; n: number; share: number | null; accent?: boolean }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className={`truncate ${accent ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{label}</span>
        <span className="shrink-0 tabular-nums text-gray-500">
          {fmtFull(n)}
          {share !== null && share < 1 ? ` · 1 in ${fmtFull(Math.max(1, Math.round(1 / share)))}` : ''}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${accent ? 'bg-primary' : 'bg-primary/40'}`} style={{ width: `${share === null ? 100 : Math.max(1.5, share * 100)}%` }} />
      </div>
    </li>
  )
}
