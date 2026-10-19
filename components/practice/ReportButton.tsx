'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { practicePost } from '@/lib/practice/api-client'
import { btnPrimary, inputCls } from './ui'

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

  if (done) return <span className="text-sm text-emerald-700">Reported. Thank you.</span>
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <Flag className="h-3.5 w-3.5" /> Report
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-30 mb-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <label className="mb-1 block text-sm font-medium text-gray-900" htmlFor={`r-${targetId}`}>
            What is wrong?
          </label>
          <p className="mb-2 text-xs text-gray-500">e.g. real assessment material, abuse, spam</p>
          <textarea
            id={`r-${targetId}`}
            className={`${inputCls} min-h-[70px]`}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button className={`${btnPrimary} mt-2 w-full`} onClick={send} disabled={busy || reason.trim().length < 5}>
            Send report
          </button>
          {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
        </div>
      )}
    </div>
  )
}
