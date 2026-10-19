'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { practicePost } from '@/lib/practice/api-client'

export function ClaimButton() {
  const router = useRouter()
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  async function claim() {
    setBusy(true)
    setErr(null)
    try {
      const { assignmentId } = await practicePost('/api/practice/reviews/claim')
      router.push(`/practice/reviews/${assignmentId}`)
    } catch (e: any) {
      setErr(e.message)
      setBusy(false)
    }
  }
  return (
    <div className="my-4">
      <button
        onClick={claim}
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
      >
        Get a submission to review
      </button>
      {err && <span className="text-sm text-red-600 ml-3">{err}</span>}
    </div>
  )
}
