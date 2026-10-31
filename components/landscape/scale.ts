// Growth colour scale (diverging: warm = shrinking, grey = flat, teal = growing). Shared by the
// treemap, its legend and the lists, so colour always means the same thing.

export const GROWTH_BINS = [
  { max: -0.1, fill: '#e8a27c', ink: '#111827', label: 'Shrinking >10%' },
  { max: -0.03, fill: '#f4d3c0', ink: '#111827', label: 'Shrinking' },
  { max: 0.03, fill: '#e7e6e1', ink: '#111827', label: 'Flat' },
  { max: 0.15, fill: '#b5ddd5', ink: '#111827', label: 'Growing' },
  { max: 0.3, fill: '#6fbcae', ink: '#111827', label: 'Growing fast' },
  { max: Infinity, fill: '#2f8f83', ink: '#ffffff', label: 'Growing >30%' },
] as const

export const NO_DATA = { fill: '#f6f6f4', ink: '#6b7280' }

export function growthStyle(g: number | null) {
  if (g === null) return NO_DATA
  return GROWTH_BINS.find((b) => g <= b.max) ?? GROWTH_BINS[GROWTH_BINS.length - 1]
}

export const fmt = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))
export const fmtFull = (n: number) => n.toLocaleString('en-US')
export const pctSigned = (g: number) => `${g >= 0 ? '+' : '−'}${Math.abs(Math.round(g * 100))}%`
