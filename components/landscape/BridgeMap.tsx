'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Gauge } from 'lucide-react'
import type { Bridge, Enjoy } from '@/lib/bridges'
import { ENJOY } from '@/lib/bridges'
import { fmt, fmtFull, pctSigned } from './scale'

export type BridgeView = Bridge & { topic: string; papers: number | null; growth: number | null }
type Bg = { id: string; label: string; emoji: string }

const VW = 640
const VH = 460
const CX = VW / 2
const CY = VH / 2

export function BridgeMap({ backgrounds, active, bridges }: { backgrounds: Bg[]; active: Bg | null; bridges: BridgeView[] }) {
  const [enjoy, setEnjoy] = useState<Enjoy[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => setSelected(null), [active?.id])

  const matches = (b: BridgeView) => !enjoy.length || b.enjoy.some((e) => enjoy.includes(e))
  const max = Math.max(1, ...bridges.map((b) => b.papers ?? 0))
  const nodes = useMemo(
    () =>
      bridges.map((b, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / bridges.length
        const r = b.papers ? 46 + 30 * Math.sqrt(b.papers / max) : 52
        return { b, x: CX + Math.cos(angle) * 200, y: CY + Math.sin(angle) * 150, r }
      }),
    [bridges, max],
  )
  const sel = bridges.find((b) => b.id === selected) ?? null

  return (
    <div className="space-y-6">
      {/* step 1: where are you coming from? */}
      <section>
        <h2 className="text-sm font-medium text-gray-900">1. Your background</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {backgrounds.map((bg) => (
            <motion.div key={bg.id} whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Link
                href={`/landscape/bridges?from=${bg.id}`}
                scroll={false}
                aria-current={active?.id === bg.id ? 'true' : undefined}
                className={`flex h-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                  active?.id === bg.id ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-800 hover:border-primary'
                }`}
              >
                <span className="text-lg" aria-hidden>{bg.emoji}</span>
                <span className="leading-tight">{bg.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {!active ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-8 text-center text-gray-600">Pick a background above to see its crossovers with ML and AI safety.</p>
      ) : (
        <>
          {/* step 2: what do you enjoy? */}
          <section>
            <h2 className="text-sm font-medium text-gray-900">2. What do you enjoy? <span className="font-normal text-gray-500">(optional)</span></h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ENJOY.map((e) => {
                const on = enjoy.includes(e.id)
                return (
                  <button
                    key={e.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setEnjoy((cur) => (on ? cur.filter((x) => x !== e.id) : [...cur, e.id]))}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition ${on ? 'bg-primary text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-primary'}`}
                  >
                    {e.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* the map */}
          <section aria-label={`Where ${active.label} meets ML and AI safety`} className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-5">
            <h2 className="px-1 text-sm font-medium text-gray-900">3. Where {active.label.toLowerCase()} meets ML</h2>
            <p className="px-1 text-xs text-gray-500">Bubble size = papers on arXiv in the last 12 months. Click one.</p>
            <svg viewBox={`0 0 ${VW} ${VH}`} className="mx-auto mt-2 hidden w-full max-w-3xl sm:block" role="img" aria-label="Crossover map">
              {nodes.map(({ b, x, y, r }) => {
                // from the edge of the centre circle to the edge of the bubble
                const d = Math.hypot(x - CX, y - CY)
                const ux = (x - CX) / d
                const uy = (y - CY) / d
                return (
                <motion.line
                  key={`l-${b.id}`}
                  x1={CX + ux * 66}
                  y1={CY + uy * 66}
                  x2={x - ux * r}
                  y2={y - uy * r}
                  stroke="#2f8f83"
                  strokeWidth={selected === b.id ? 3 : 2}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: matches(b) ? 0.5 : 0.12 }}
                  transition={{ duration: 0.6 }}
                />
                )
              })}
              <circle cx={CX} cy={CY} r={66} fill="#1f5c5c" />
              <text x={CX} y={CY - 6} textAnchor="middle" fontSize="26">{active.emoji}</text>
              <text x={CX} y={CY + 22} textAnchor="middle" fontSize="13" fill="#fff" fontWeight={500}>
                {active.label.length > 18 ? active.label.split(' ')[0] : active.label}
              </text>
              {nodes.map(({ b, x, y, r }, i) => (
                <motion.g
                  key={b.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${b.name}${b.papers ? `, ${fmtFull(b.papers)} papers` : ''}`}
                  onClick={() => setSelected(b.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(b.id)}
                  className="cursor-pointer outline-none"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: matches(b) ? 1 : 0.3 }}
                  whileHover={{ scale: 1.06 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 + i * 0.07 }}
                  style={{ transformOrigin: `${x}px ${y}px` }}
                >
                  <circle cx={x} cy={y} r={r} fill={selected === b.id ? '#2f8f83' : '#e6f3f0'} stroke="#2f8f83" strokeWidth={selected === b.id ? 0 : 1.5} />
                  <foreignObject x={x - r + 6} y={y - r + 6} width={2 * r - 12} height={2 * r - 12}>
                    <div className={`flex h-full flex-col items-center justify-center text-center leading-tight ${selected === b.id ? 'text-white' : 'text-gray-900'}`}>
                      <span className="text-[12px] font-medium">{b.name}</span>
                      {b.papers !== null && <span className="mt-0.5 text-[11px] opacity-75">{fmt(b.papers)}/yr</span>}
                    </div>
                  </foreignObject>
                </motion.g>
              ))}
            </svg>

            {/* list: phones, keyboard and screen readers */}
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {bridges.map((b) => (
                <li key={b.id} className={`min-w-0 ${matches(b) ? '' : 'opacity-40'}`}>
                  <button
                    type="button"
                    onClick={() => setSelected(b.id)}
                    className={`flex w-full min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition ${selected === b.id ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary'}`}
                  >
                    <span
                      className="shrink-0 rounded-full bg-primary/80"
                      style={{ width: 10 + 22 * Math.sqrt((b.papers ?? 0) / max), height: 10 + 22 * Math.sqrt((b.papers ?? 0) / max) }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-900">{b.name}</span>
                      <span className="block truncate text-xs text-gray-500">{b.blurb}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs tabular-nums text-gray-500">
                      {b.papers !== null ? `${fmt(b.papers)}/yr` : '…'}
                      {b.growth !== null && <span className="block">{pctSigned(b.growth)}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {sel && (
            <motion.section
              key={sel.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm"
              aria-live="polite"
            >
              <p className="text-xs text-gray-500">{active.label} × ML · {sel.cats.join(' · ')}</p>
              <h2 className="mt-0.5 text-xl font-semibold text-gray-900">{sel.name}</h2>
              <p className="mt-1 text-gray-600">{sel.blurb}.</p>
              <div className="mt-4 flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Papers, last 12 months</p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900">{sel.papers !== null ? fmtFull(sel.papers) : 'counting…'}</p>
                </div>
                {sel.growth !== null && (
                  <div>
                    <p className="text-xs text-gray-500">Change on year before</p>
                    <p className="text-lg font-semibold tabular-nums text-gray-900">{pctSigned(sel.growth)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Good fit if you enjoy</p>
                  <p className="text-sm text-gray-800">{sel.enjoy.map((e) => ENJOY.find((x) => x.id === e)?.label).join(', ')}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/swipe?focus=${encodeURIComponent(sel.cats.join(','))}&label=${encodeURIComponent(sel.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light"
                >
                  Rate abstracts from this crossover <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/landscape/niche?q=${encodeURIComponent(sel.topic)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Gauge className="h-4 w-4" /> How niche is it?
                </Link>
              </div>
            </motion.section>
          )}
        </>
      )}
    </div>
  )
}
