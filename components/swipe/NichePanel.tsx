import Link from 'next/link'
import { ArrowRight, FlaskConical, MessagesSquare } from 'lucide-react'
import type { CategoryEvidence, Niche } from '@/lib/niche-core'

const STAGES = [
  { n: 1, label: 'Explore' },
  { n: 2, label: 'Narrow' },
  { n: 3, label: 'Focus' },
] as const

const pct = (x: number) => `${Math.round(x * 100)}%`
const n1 = (x: number) => (Number.isInteger(x) ? String(x) : x.toFixed(1))

export function StageStepper({ niche, onDark = false }: { niche: Niche; onDark?: boolean }) {
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Stage ${niche.stageIndex} of 3: ${STAGES[niche.stageIndex - 1].label}`}>
      {STAGES.map((s, i) => {
        const done = s.n < niche.stageIndex
        const current = s.n === niche.stageIndex
        return (
          <li key={s.n} className="flex flex-1 items-center gap-1.5">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                current
                  ? onDark ? 'bg-white text-primary' : 'bg-primary text-white'
                  : done
                    ? onDark ? 'bg-white/40 text-white' : 'bg-primary-200 text-primary-800'
                    : onDark ? 'bg-white/15 text-white/60' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s.n}
            </span>
            <span className={`text-xs font-semibold ${current ? (onDark ? 'text-white' : 'text-gray-900') : onDark ? 'text-white/60' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {i < STAGES.length - 1 && <span className={`h-px flex-1 ${onDark ? 'bg-white/25' : 'bg-gray-200'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

const STATUS = {
  likely: { label: 'Likely niche', cls: 'bg-primary text-white' },
  uncertain: { label: 'Testing', cls: 'bg-amber-100 text-amber-800' },
  unlikely: { label: 'Below average', cls: 'bg-gray-100 text-gray-500' },
} as const

/** Interest rate bar with its 90% range (band) and a tick for your overall average. */
export function EvidenceRow({ c, baseRate }: { c: CategoryEvidence; baseRate: number }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-gray-900">{c.name}</span>
          <span className="block truncate text-[11px] text-gray-400">
            {c.field} · {c.code}
          </span>
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS[c.status].cls}`}>{STATUS[c.status].label}</span>
      </div>
      <div className="relative mt-1.5 h-2.5 rounded-full bg-gray-100" title={`90% range ${pct(c.low)}–${pct(c.high)}`}>
        <div className="absolute inset-y-0 rounded-full bg-primary-200" style={{ left: `${c.low * 100}%`, width: `${Math.max(1, (c.high - c.low) * 100)}%` }} />
        <div className="absolute inset-y-0 w-1 -translate-x-1/2 rounded-full bg-primary" style={{ left: `${c.rate * 100}%` }} />
        <div className="absolute -inset-y-1 w-px bg-gray-500" style={{ left: `${baseRate * 100}%` }} />
      </div>
      <div className="mt-1 text-[11px] tabular-nums text-gray-500">
        {n1(c.likes)} of {n1(c.seen)} interesting
      </div>
    </li>
  )
}

export function NichePanel({ niche, compact = false, guest = false }: { niche: Niche; compact?: boolean; guest?: boolean }) {
  const rows = niche.categories.slice(0, compact ? 3 : 6)
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary">
          <FlaskConical className="h-4 w-4" />
        </span>
        <h2 className="font-semibold text-gray-900">Your interests</h2>
        <span className="ml-auto text-xs tabular-nums text-gray-500">{niche.swipes} rated</span>
      </div>

      <div className="mt-4">
        <StageStepper niche={niche} />
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(3, niche.stageProgress * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">{niche.nextStep}</p>
      </div>

      {rows.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">By arXiv category</p>
            {niche.swipes > 0 && <p className="text-[11px] text-gray-400">your avg {pct(niche.baseRate)}</p>}
          </div>
          <ul className="space-y-3.5">
            {rows.map((c) => (
              <EvidenceRow key={c.code} c={c} baseRate={niche.baseRate} />
            ))}
          </ul>
        </div>
      )}

      {!compact && niche.topics.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Topics in your {niche.likely.length ? 'likely niche' : 'leading categories'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {niche.topics.slice(0, 8).map((k) => (
              <span key={k.term} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                {k.term}
              </span>
            ))}
          </div>
        </div>
      )}

      {!compact && guest && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <Link href="/register?next=/niche" className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-light">
            Save my progress <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-center text-xs text-gray-500">Free account. Your ratings so far come with you.</p>
        </div>
      )}

      {!compact && !guest && (
        <div className="mt-5 space-y-1 border-t border-gray-100 pt-4 text-sm">
          <Link href="/niche" className="flex items-center justify-between rounded-lg px-2 py-1.5 font-medium text-primary hover:bg-primary-50">
            Full analysis <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/discussions" className="flex items-center justify-between rounded-lg px-2 py-1.5 font-medium text-primary hover:bg-primary-50">
            <span className="inline-flex items-center gap-2">
              <MessagesSquare className="h-4 w-4" /> Review your picks
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
