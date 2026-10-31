'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Asks the server to count areas not yet counted this month, a batch at a time, and refreshes the
 * page as numbers arrive. The server keeps arXiv's pace and runs one refresh at a time.
 */
export function StatsRefresher({ body, stale, total, noun = 'areas' }: { body: Record<string, string>; stale: number; total: number; noun?: string }) {
  const router = useRouter()
  const started = useRef(false)
  const [left, setLeft] = useState(stale)
  const [state, setState] = useState<'idle' | 'running' | 'failed'>('idle')

  useEffect(() => {
    if (!stale || started.current) return
    started.current = true
    setState('running')
    ;(async () => {
      for (let round = 0; round < 15; round++) {
        const res = await fetch('/api/research/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null)
        const d = res?.ok ? await res.json().catch(() => null) : null
        if (!d) return setState('failed')
        setLeft(d.remaining)
        if (d.updated?.length) router.refresh()
        if (d.errors?.length && !d.updated?.length) return setState('failed')
        if (!d.remaining) return setState('idle')
        if (d.busy) await new Promise((r) => setTimeout(r, 5000))
      }
      setState('idle')
    })()
  }, [stale, body, router])

  if (state === 'running')
    return (
      <p role="status" className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm text-primary-700">
        <Loader2 className="h-4 w-4 animate-spin" /> Counting papers on arXiv… {total - left} of {total} {noun}
      </p>
    )
  if (state === 'failed') return <p className="mb-4 text-sm text-gray-500">arXiv didn&apos;t answer just now; some numbers are missing. Reload to try again.</p>
  return null
}
