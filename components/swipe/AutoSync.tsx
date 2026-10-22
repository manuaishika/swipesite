'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Stocks the database from arXiv when the deck is nearly empty, then reloads the page.
 * The server decides whether a fetch is actually needed (and never runs more than one at a time).
 */
export function AutoSync({ needed, empty = false }: { needed: boolean; empty?: boolean }) {
  const router = useRouter()
  const started = useRef(false)
  const [state, setState] = useState<'idle' | 'fetching' | 'failed'>('idle')

  useEffect(() => {
    if (!needed || started.current) return
    started.current = true
    setState('fetching')
    ;(async () => {
      let added = 0
      // a few rounds at most: each round pulls a few more categories
      for (let round = 0; round < 3 && added === 0; round++) {
        const res = await fetch('/api/papers/sync', { method: 'POST' }).catch(() => null)
        if (!res?.ok) break
        const data = await res.json().catch(() => ({}))
        added += data.added ?? 0
        if (data.skipped === 'fresh' || data.skipped === 'just-ran') break
        if (data.skipped === 'busy') await new Promise((r) => setTimeout(r, 4000))
      }
      if (added > 0) router.refresh()
      setState(added > 0 || !empty ? 'idle' : 'failed')
    })()
  }, [needed, empty, router])

  if (state === 'fetching')
    return (
      <p role="status" className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm text-primary-700">
        <Loader2 className="h-4 w-4 animate-spin" /> Fetching new papers from arXiv…
      </p>
    )
  if (state === 'failed')
    return <p className="mb-4 text-sm text-gray-500">Couldn&apos;t reach arXiv just now. Try again in a minute.</p>
  return null
}
