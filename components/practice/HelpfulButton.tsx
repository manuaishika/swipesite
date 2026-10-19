'use client'

import { useState } from 'react'
import { practicePost } from '@/lib/practice/api-client'

export function HelpfulButton({ reviewId, initial }: { reviewId: string; initial: boolean | null }) {
  const [helpful, setHelpful] = useState<boolean>(initial === true)
  const [err, setErr] = useState<string | null>(null)
  async function toggle() {
    const next = !helpful
    try {
      await practicePost(`/api/practice/reviews/${reviewId}/helpful`, { helpful: next })
      setHelpful(next)
      setErr(null)
    } catch (e: any) {
      setErr(e.message)
    }
  }
  return (
    <span>
      <button
        onClick={toggle}
        className={`px-3 py-1.5 rounded text-sm border border-primary ${
          helpful ? 'bg-primary text-white' : 'text-primary'
        }`}
      >
        {helpful ? 'Marked helpful' : 'Mark as helpful'}
      </button>
      {err && <span className="text-sm text-red-600 ml-2">{err}</span>}
    </span>
  )
}
