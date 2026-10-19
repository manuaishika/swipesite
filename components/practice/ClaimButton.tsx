'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { practicePost } from '@/lib/practice/api-client'
import { btnPrimary } from './ui'

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
    <div>
      <button onClick={claim} disabled={busy} className={btnPrimary}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Get a submission to review
      </button>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  )
}
