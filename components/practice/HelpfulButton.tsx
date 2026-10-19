'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
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
    <span className="inline-flex items-center gap-2">
      <button
        onClick={toggle}
        aria-pressed={helpful}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
          helpful
            ? 'border-primary bg-primary text-white'
            : 'border-gray-300 bg-white text-gray-700 hover:border-primary hover:text-primary'
        }`}
      >
        <ThumbsUp className="h-4 w-4" />
        {helpful ? 'Marked helpful' : 'Mark as helpful'}
      </button>
      {err && <span className="text-sm text-red-600">{err}</span>}
    </span>
  )
}
