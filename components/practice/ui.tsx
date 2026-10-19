import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'

const focus =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

export const btnPrimary = `inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light ${focus}`
export const btnSecondary = `inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 ${focus}`
export const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-500'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>
}

export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto px-4 py-8 sm:px-6 ${wide ? 'max-w-7xl' : 'max-w-4xl'}`}>{children}</div>
}

export function Chip({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'teal' | 'amber' }) {
  const t = {
    gray: 'bg-gray-100 text-gray-600',
    teal: 'bg-primary-50 text-primary-700',
    amber: 'bg-amber-100 text-amber-800',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>
}

// 1 (weak) .. 5 (strong). Works for averages too (rounded to the nearest band).
export function scoreTone(n: number) {
  const r = Math.round(n)
  if (r <= 1) return 'bg-red-100 text-red-800'
  if (r === 2) return 'bg-orange-100 text-orange-800'
  if (r === 3) return 'bg-amber-100 text-amber-800'
  if (r === 4) return 'bg-emerald-100 text-emerald-800'
  return 'bg-emerald-200 text-emerald-900'
}

export function ScoreChip({ value, size = 'md' }: { value: number | null; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-6 min-w-[1.5rem] text-xs' : 'h-8 min-w-[2.25rem] text-sm'
  if (value === null || Number.isNaN(value)) {
    return <span className={`inline-flex ${dim} items-center justify-center rounded-md bg-gray-100 px-1.5 text-gray-400`}>-</span>
  }
  const shown = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return (
    <span className={`inline-flex ${dim} items-center justify-center rounded-md px-1.5 font-semibold tabular-nums ${scoreTone(value)}`}>
      {shown}
    </span>
  )
}

export function ArxivLink({ id, url }: { id: string | null; url: string | null }) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
    >
      arXiv:{id} <ExternalLink className="h-3 w-3" />
    </a>
  )
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-lg font-semibold text-gray-900">{children}</h2>
      {hint && <span className="text-sm text-gray-500">{hint}</span>}
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary">{icon}</div>
      <p className="font-medium text-gray-900">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-gray-500">{children}</div>}
    </div>
  )
}
