'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Clock, Coins, DoorOpen, Lightbulb } from 'lucide-react'
import { COLUMNS, EDGES, FAQ, NODES, type PathNode } from '@/lib/paths'

const VW = 1000
const VH = 470
const NW = 156
const NH = 46
const COL_X = [88, 300, 512, 724, 912]
const TOP = 70

function pos(n: PathNode) {
  const inCol = NODES.filter((m) => m.col === n.col).length
  const gap = (VH - TOP - 50) / inCol // leaves a channel at the bottom for long links
  return { x: COL_X[n.col], y: TOP + gap * n.row + gap / 2 }
}

export function PathMap() {
  const [sel, setSel] = useState('phd')
  const node = NODES.find((n) => n.id === sel)!
  const linked = new Set(EDGES.filter((e) => e.from === sel || e.to === sel).flatMap((e) => [e.from, e.to]))

  return (
    <div className="mt-6 space-y-6">
      {/* desktop: the whole graph */}
      <section className="hidden rounded-2xl border border-gray-200 bg-white p-4 md:block" aria-label="Map of research career paths">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
          {COLUMNS.map((c, i) => (
            <text key={c} x={COL_X[i]} y={28} textAnchor="middle" fontSize="12" fill="#6b7280" style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {c}
            </text>
          ))}
          {EDGES.map((e, i) => {
            const from = NODES.find((n) => n.id === e.from)!
            const to = NODES.find((n) => n.id === e.to)!
            const a = pos(from)
            const b = pos(to)
            const on = e.from === sel || e.to === sel
            // same column: a short vertical link; otherwise a curve from right edge to left edge
            const sameCol = from.col === to.col
            const down = b.y > a.y
            const skip = Boolean(e.channel)
            const d = sameCol
              ? `M ${a.x} ${a.y + (down ? NH / 2 : -NH / 2)} L ${b.x} ${b.y + (down ? -NH / 2 : NH / 2)}`
              : skip
                ? (() => {
                    // links that skip a column run along the channel under the boxes, so they never look
                    // like they end at a box in between
                    const x1 = a.x + NW / 2
                    const x2 = b.x - NW / 2
                    const g1 = x1 + 26
                    const g2 = x2 - 16
                    const ch = VH - 18
                    const r = 10
                    return `M ${x1} ${a.y} L ${g1 - r} ${a.y} Q ${g1} ${a.y} ${g1} ${a.y + r} L ${g1} ${ch - r} Q ${g1} ${ch} ${g1 + r} ${ch} L ${g2 - r} ${ch} Q ${g2} ${ch} ${g2} ${ch - r} L ${g2} ${b.y + r} Q ${g2} ${b.y} ${g2 + r} ${b.y} L ${x2} ${b.y}`
                  })()
                : (() => {
                  const x1 = a.x + NW / 2
                  const x2 = b.x - NW / 2
                  const mx = (x1 + x2) / 2
                  return `M ${x1} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${x2} ${b.y}`
                })()
            const lx = (a.x + NW / 2 + b.x - NW / 2) / 2
            const ly = (a.y + b.y) / 2
            return (
              <g key={`${e.from}-${e.to}`}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke={on ? '#2f8f83' : '#d1d5db'}
                  strokeWidth={on ? 2.5 : 1.5}
                  strokeDasharray={e.label ? '5 4' : undefined}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.05 * i }}
                />
                {e.label && (
                  <g>
                    <rect x={lx - 56} y={ly - 9} width={112} height={18} rx={9} fill="#ffffff" stroke={on ? '#2f8f83' : '#e5e7eb'} />
                    <text x={lx} y={ly + 4} textAnchor="middle" fontSize="11" fill={on ? '#1f5c5c' : '#6b7280'}>
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
          {NODES.map((n, i) => {
            const p = pos(n)
            const active = n.id === sel
            const near = linked.has(n.id)
            return (
              <motion.g
                key={n.id}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={n.label}
                onClick={() => setSel(n.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(n.id)}
                className="cursor-pointer outline-none"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.04 * i }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              >
                <rect
                  x={p.x - NW / 2}
                  y={p.y - NH / 2}
                  width={NW}
                  height={NH}
                  rx={12}
                  fill={active ? '#1f5c5c' : near ? '#e6f3f0' : '#ffffff'}
                  stroke={active ? '#1f5c5c' : near ? '#2f8f83' : '#d1d5db'}
                  strokeWidth={1.5}
                />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize="14" fontWeight={500} fill={active ? '#ffffff' : '#111827'}>
                  {n.label}
                </text>
              </motion.g>
            )
          })}
        </svg>
      </section>

      {/* phones: the same steps as a vertical timeline */}
      <section className="md:hidden" aria-label="Research career steps">
        <ol className="relative space-y-4 border-l-2 border-primary/20 pl-5">
          {COLUMNS.map((c, i) => (
            <li key={c} className="relative">
              <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" aria-hidden />
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{c}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {NODES.filter((n) => n.col === i).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    aria-pressed={n.id === sel}
                    onClick={() => setSel(n.id)}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${n.id === sel ? 'border-primary bg-primary text-white' : linked.has(n.id) ? 'border-primary/40 bg-primary-50 text-gray-900' : 'border-gray-200 bg-white text-gray-800'}`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* the selected step */}
      <motion.section key={node.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm" aria-live="polite">
        <p className="text-xs uppercase tracking-wide text-gray-500">{COLUMNS[node.col]}</p>
        <h2 className="text-xl font-semibold text-gray-900">{node.label}</h2>
        <p className="mt-1 text-gray-700">{node.what}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <Fact icon={<Clock className="h-4 w-4" />} k="How long" v={node.length} />
          <Fact icon={<DoorOpen className="h-4 w-4" />} k="How to get in" v={node.getIn} />
          <Fact icon={<Coins className="h-4 w-4" />} k="Money" v={node.money} />
        </dl>
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" /> {node.tip}
        </p>
        <NextSteps id={node.id} onPick={setSel} />
      </motion.section>

      {/* common questions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">Common questions</h2>
        <div className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-gray-900">
                {q}
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-gray-600">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Typical for the US, UK and Europe; details vary by country and field. Coming from another discipline?{' '}
          <Link href="/landscape/bridges" className="text-primary underline">See where your field meets ML</Link>.
        </p>
      </section>
    </div>
  )
}

function Fact({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-gray-500">{icon} {k}</dt>
      <dd className="mt-1 text-sm text-gray-900">{v}</dd>
    </div>
  )
}

function NextSteps({ id, onPick }: { id: string; onPick: (id: string) => void }) {
  const next = EDGES.filter((e) => e.from === id).map((e) => NODES.find((n) => n.id === e.to)!)
  const prev = EDGES.filter((e) => e.to === id).map((e) => NODES.find((n) => n.id === e.from)!)
  if (!next.length && !prev.length) return null
  const chip = 'rounded-full bg-white px-3 py-1 text-sm text-gray-800 ring-1 ring-gray-200 hover:ring-primary'
  return (
    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      {prev.length > 0 && (
        <div>
          <p className="text-xs text-gray-500">Usually comes after</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">{prev.map((n) => <button key={n.id} type="button" onClick={() => onPick(n.id)} className={chip}>{n.label}</button>)}</div>
        </div>
      )}
      {next.length > 0 && (
        <div>
          <p className="text-xs text-gray-500">Leads to</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">{next.map((n) => <button key={n.id} type="button" onClick={() => onPick(n.id)} className={chip}>{n.label}</button>)}</div>
        </div>
      )}
    </div>
  )
}
