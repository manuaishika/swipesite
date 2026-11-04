'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const COLORS = ['#2f8f83', '#fbbf24', '#f97316', '#38bdf8', '#a78bfa', '#34d399']

/** A short burst of confetti from the centre, falling with a bit of gravity. */
export function Confetti({ count = 70, burstKey = 0 }: { count?: number; burstKey?: number }) {
  const reduced = useReducedMotion()
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
        const power = 160 + Math.random() * 260
        return {
          x: Math.cos(angle) * power,
          y: Math.sin(angle) * power - 120,
          r: Math.random() * 720 - 360,
          c: COLORS[i % COLORS.length],
          w: 6 + Math.random() * 6,
          d: 1.2 + Math.random() * 0.8,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, burstKey],
  )
  if (reduced) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={`${burstKey}-${i}`}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{ width: b.w, height: b.w * 0.45, background: b.c }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 420], rotate: b.r, opacity: [1, 1, 0] }}
          transition={{ duration: b.d, ease: 'easeOut', times: [0, 0.35, 1] }}
        />
      ))}
    </div>
  )
}
