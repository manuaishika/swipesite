'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { practicePost } from '@/lib/practice/api-client'
import { LIMITS } from '@/lib/practice/constants'

export function StartForm({ abstractId }: { abstractId: string }) {
  const router = useRouter()
  const [minutes, setMinutes] = useState<number>(LIMITS.defaultMinutes)
  const [declared, setDeclared] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const validMinutes = Number.isInteger(minutes) && minutes >= LIMITS.minMinutes && minutes <= LIMITS.maxMinutes

  async function start() {
    setBusy(true)
    setErr(null)
    try {
      const { id } = await practicePost('/api/practice/sessions', { abstractId, minutes, declared })
      router.push(`/practice/session/${id}`)
    } catch (e: any) {
      setErr(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="bg-white border rounded-xl p-5">
      <label className="block text-sm font-medium mb-1" htmlFor="mins">
        Time limit (minutes, {LIMITS.minMinutes}-{LIMITS.maxMinutes})
      </label>
      <input
        id="mins"
        type="number"
        min={LIMITS.minMinutes}
        max={LIMITS.maxMinutes}
        value={minutes}
        onChange={(e) => setMinutes(Number(e.target.value))}
        className="border rounded p-2 w-28"
      />
      <label className="flex items-start gap-2 mt-4 text-sm">
        <input type="checkbox" className="mt-1" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
        <span>
          I declare that I will not use any AI assistance (reading aids, drafting, rewriting or checking) in this
          session.
        </span>
      </label>
      {err && <div className="text-sm text-red-600 mt-3">{err}</div>}
      <button
        onClick={start}
        disabled={!declared || busy || !validMinutes}
        className="mt-4 px-4 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
      >
        Start timed session
      </button>
      <p className="text-sm text-gray-500 mt-2">The timer starts immediately and the abstract is shown first.</p>
    </div>
  )
}
