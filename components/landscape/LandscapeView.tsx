'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, TrendingUp, Users, X } from 'lucide-react'
import { squarify } from '@/lib/treemap'
import { GROWTH_BINS, NO_DATA, fmt, fmtFull, growthStyle, pctSigned } from './scale'

export type Area = { code: string; name: string; field: string; papers: number | null; prev: number | null; growth: number | null; people: number }

const W = 1000
const GAP = 3.5 // layout units between fields

type Placed = { x: number; y: number; w: number; h: number; item: Area }

function layout(shown: Area[], H: number): Placed[] {
  const byField = new Map<string, Area[]>()
  for (const a of shown) byField.set(a.field, [...(byField.get(a.field) ?? []), a])
  const groups = squarify(Array.from(byField.entries()), ([, list]) => list.reduce((s, a) => s + (a.papers ?? 0), 0), { x: 0, y: 0, w: W, h: H })
  return groups.flatMap((g) => {
    const inner = { x: g.x + GAP, y: g.y + GAP, w: Math.max(0, g.w - 2 * GAP), h: Math.max(0, g.h - 2 * GAP) }
    return squarify(g.item[1], (a) => a.papers ?? 0, inner)
  })
}

export function LandscapeView({ areas, total, window }: { areas: Area[]; total: number | null; window: string }) {
  const [field, setField] = useState<string>('all')
  const [selected, setSelected] = useState<string | null>(null)

  const counted = areas.filter((a) => a.papers)
  const fields = useMemo(() => Array.from(new Set(counted.map((a) => a.field))), [counted])
  const shown = field === 'all' ? counted : counted.filter((a) => a.field === field)

  // two levels (fields, then their categories); phones get a taller map so boxes stay readable
  const wide = useMemo(() => layout(shown, 560), [shown])
  const tall = useMemo(() => layout(shown, 1500), [shown])

  const sel = areas.find((a) => a.code === selected) ?? null
  const biggest = [...counted].sort((a, b) => (b.papers ?? 0) - (a.papers ?? 0)).slice(0, 8)
  const growing = counted.filter((a) => (a.papers ?? 0) >= 500 && a.growth !== null).sort((a, b) => b.growth! - a.growth!).slice(0, 8)
  const explored = [...counted].filter((a) => a.people > 0).sort((a, b) => b.people - a.people).slice(0, 8)

  if (!counted.length)
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-10 text-center text-gray-600">
        Counting papers on arXiv for the first time. The map fills in as numbers arrive.
      </div>
    )

  return (
    <div className="space-y-8">
      {/* headline numbers */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Headline label="Papers on arXiv" value={total ? fmtFull(total) : '–'} sub={window || 'last 12 months'} />
        <Headline label="Biggest area" value={biggest[0]?.name ?? '–'} sub={biggest[0]?.papers ? `${fmtFull(biggest[0].papers)} papers` : ''} />
        <Headline label="Fastest growing (500+ papers)" value={growing[0]?.name ?? '–'} sub={growing[0]?.growth != null ? `${pctSigned(growing[0].growth)} on the year before` : ''} />
      </div>

      {/* treemap */}
      <section aria-label="Map of research areas">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select value={field} onChange={(e) => setField(e.target.value)} aria-label="Field" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="all">All fields</option>
            {fields.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500">Box size = papers in the last 12 months. Colour = change on the 12 months before. Click a box.</p>
        </div>
        <div className="hidden sm:block">
          <TreemapBox tiles={wide} H={560} pxPerUnit={1.1} selected={selected} onPick={setSelected} />
        </div>
        <div className="sm:hidden">
          <TreemapBox tiles={tall} H={1500} pxPerUnit={0.36} selected={selected} onPick={setSelected} />
        </div>
        <Legend />
      </section>

      {sel && <AreaCard a={sel} total={total} onClose={() => setSelected(null)} />}

      {/* the same data as lists (readable on phones and by screen readers) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RankList title="Biggest areas" icon={<span className="text-primary">■</span>} items={biggest} metric={(a) => a.papers ?? 0} label={(a) => fmt(a.papers ?? 0)} onPick={setSelected} />
        <RankList title="Growing fastest" icon={<TrendingUp className="h-4 w-4 text-primary" />} items={growing} metric={(a) => Math.max(0, a.growth ?? 0)} label={(a) => pctSigned(a.growth ?? 0)} onPick={setSelected} note="Areas with 500+ papers a year" />
        <RankList
          title="Explored here now"
          icon={<Users className="h-4 w-4 text-primary" />}
          items={explored}
          metric={(a) => a.people}
          label={(a) => `${a.people}`}
          onPick={setSelected}
          note="People rating papers in it, last 90 days"
          empty="Nobody yet. Rate a few abstracts and this list starts."
        />
      </div>
      <p className="text-xs text-gray-500">
        Counts are papers listed in each arXiv category, including cross-listed ones, so a paper can count in more than one area. Updated monthly from the arXiv API.
      </p>
    </div>
  )
}

function TreemapBox({ tiles, H, pxPerUnit, selected, onPick }: { tiles: Placed[]; H: number; pxPerUnit: number; selected: string | null; onPick: (c: string) => void }) {
  const [hover, setHover] = useState<{ a: Area; x: number; y: number; flipX: boolean; flipY: boolean } | null>(null)
  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-white" style={{ aspectRatio: `${W} / ${H}` }} onMouseLeave={() => setHover(null)}>
      {tiles.map((t) => {
        const s = growthStyle(t.item.growth)
        const pw = t.w * pxPerUnit
        const ph = t.h * pxPerUnit
        const big = pw > 100 && ph > 46
        const mid = pw > 46 && ph > 24
        return (
          <button
            key={t.item.code}
            type="button"
            onClick={() => onPick(t.item.code)}
            onMouseMove={(e) => {
              const r = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
              const x = e.clientX - r.left
              const y = e.clientY - r.top
              setHover({ a: t.item, x, y, flipX: x > r.width / 2, flipY: y > r.height * 0.6 })
            }}
            aria-label={`${t.item.name}: ${fmtFull(t.item.papers ?? 0)} papers${t.item.growth != null ? `, ${pctSigned(t.item.growth)}` : ''}`}
            className={`absolute overflow-hidden text-left transition-[filter] hover:brightness-95 focus-visible:z-10 ${selected === t.item.code ? 'ring-2 ring-inset ring-gray-900' : ''}`}
            style={{
              left: `${(t.x / W) * 100}%`,
              top: `${(t.y / H) * 100}%`,
              width: `calc(${(t.w / W) * 100}% - 2px)`,
              height: `calc(${(t.h / H) * 100}% - 2px)`,
              background: s.fill,
              color: s.ink,
              borderRadius: 4,
            }}
          >
            {mid && (
              <span className="block p-1.5 leading-tight sm:p-2">
                <span className={`block truncate font-medium ${big ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}`}>{big ? t.item.name : t.item.code}</span>
                {big && (
                  <span className="block truncate text-[10px] opacity-80 sm:text-xs">
                    {fmt(t.item.papers ?? 0)}
                    {t.item.growth != null ? ` · ${pctSigned(t.item.growth)}` : ''}
                  </span>
                )}
              </span>
            )}
          </button>
        )
      })}
      {hover && (
        <div
          className="pointer-events-none absolute z-20 w-56 rounded-xl border border-gray-200 bg-white p-3 text-xs shadow-lg"
          style={{
            left: hover.x + 12,
            top: hover.y + 12,
            transform: `translate(${hover.flipX ? 'calc(-100% - 24px)' : '0'}, ${hover.flipY ? 'calc(-100% - 24px)' : '0'})`,
          }}
        >
          <p className="font-medium text-gray-900">{hover.a.name}</p>
          <p className="text-gray-500">{hover.a.field} · {hover.a.code}</p>
          <p className="mt-1.5 tabular-nums text-gray-800">{fmtFull(hover.a.papers ?? 0)} papers</p>
          {hover.a.growth != null && <p className="tabular-nums text-gray-600">{pctSigned(hover.a.growth)} vs year before ({fmtFull(hover.a.prev ?? 0)})</p>}
          {hover.a.people > 0 && <p className="text-gray-600">{hover.a.people} people here exploring it</p>}
        </div>
      )}
    </div>
  )
}

function Headline({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-gray-900 sm:text-xl">{value}</p>
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  )
}

function Legend() {
  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600" aria-label="Colour legend">
      {GROWTH_BINS.map((b) => (
        <li key={b.label} className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm" style={{ background: b.fill }} /> {b.label}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm border border-dashed border-gray-300" style={{ background: NO_DATA.fill }} /> Not counted yet
      </li>
    </ul>
  )
}

function RankList({
  title, icon, items, metric, label, onPick, note, empty,
}: {
  title: string; icon: React.ReactNode; items: Area[]; metric: (a: Area) => number; label: (a: Area) => string; onPick: (code: string) => void; note?: string; empty?: string
}) {
  const max = Math.max(1, ...items.map(metric))
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-medium text-gray-900">{icon} {title}</h2>
      {note && <p className="mt-0.5 text-xs text-gray-500">{note}</p>}
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-2.5">
          {items.map((a) => (
            <li key={a.code}>
              <button type="button" onClick={() => onPick(a.code)} className="w-full text-left">
                <span className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-gray-800">{a.name}</span>
                  <span className="shrink-0 tabular-nums text-gray-500">{label(a)}</span>
                </span>
                <span className="mt-1 block h-1.5 rounded-full bg-gray-100">
                  <span className="block h-full rounded-full" style={{ width: `${Math.max(3, (metric(a) / max) * 100)}%`, background: '#2f8f83' }} />
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function AreaCard({ a, total, onClose }: { a: Area; total: number | null; onClose: () => void }) {
  const share = total && a.papers ? a.papers / total : null
  return (
    <section className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{a.field} · {a.code}</p>
          <h2 className="text-xl font-semibold text-gray-900">{a.name}</h2>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat k="Papers, last 12 months" v={a.papers ? fmtFull(a.papers) : '–'} />
        <Stat k="Change on year before" v={a.growth != null ? pctSigned(a.growth) : '–'} />
        <Stat k="Share of arXiv" v={share ? `1 in ${Math.max(1, Math.round(1 / share))}` : '–'} />
        <Stat k="People here exploring it" v={String(a.people)} />
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/swipe?focus=${encodeURIComponent(a.code)}&label=${encodeURIComponent(a.name)}`} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light">
          Rate abstracts from this area <ArrowRight className="h-4 w-4" />
        </Link>
        <Link href="/landscape/niche" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          How niche is a topic inside it?
        </Link>
      </div>
    </section>
  )
}

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div className="rounded-xl bg-gray-50 p-3">
    <dt className="text-xs text-gray-500">{k}</dt>
    <dd className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">{v}</dd>
  </div>
)
