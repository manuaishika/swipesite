'use client'

import { useState } from 'react'
import { practicePost } from '@/lib/practice/api-client'

export function ReportButton({ type, targetId }: { type: 'submission' | 'review'; targetId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    setErr(null)
    try {
      await practicePost('/api/practice/reports', { type, targetId, reason })
      setDone(true)
    } catch (e: any) {
      setErr(e.message)
    }
    setBusy(false)
  }

  if (done) return <span className="text-sm text-green-700">Reported. Thank you.</span>
  return (
    <span>
      <button className="text-sm text-gray-500 underline" onClick={() => setOpen(!open)}>
        Report
      </button>
      {open && (
        <div className="mt-2 bg-white border rounded-lg p-3">
          <label className="block text-sm font-medium mb-1" htmlFor={`r-${targetId}`}>
            What is wrong? (e.g. real assessment material, abuse, spam)
          </label>
          <textarea
            id={`r-${targetId}`}
            className="w-full border rounded p-2 text-sm"
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            className="mt-2 px-3 py-1.5 rounded bg-primary text-white text-sm disabled:opacity-50"
            onClick={send}
            disabled={busy || reason.trim().length < 5}
          >
            Send report
          </button>
        </div>
      )}
      {err && <div className="text-sm text-red-600 mt-1">{err}</div>}
    </span>
  )
}
