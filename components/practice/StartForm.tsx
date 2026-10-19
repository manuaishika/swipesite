'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'
import { practicePost } from '@/lib/practice/api-client'
import { LIMITS } from '@/lib/practice/constants'
import { Card, btnPrimary, inputCls } from './ui'

const PRESETS = [15, 30, 45, 60]

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
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900">Set up your session</h2>

      <p className="mt-4 text-sm font-medium text-gray-700">Time limit</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinutes(m)}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
              minutes === m
                ? 'border-primary bg-primary text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-primary'
            }`}
          >
            {m} min
          </button>
        ))}
        <div className="flex items-center gap-2">
          <label htmlFor="mins" className="sr-only">
            Custom minutes
          </label>
          <input
            id="mins"
            type="number"
            min={LIMITS.minMinutes}
            max={LIMITS.maxMinutes}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className={`${inputCls} !w-20 text-center`}
          />
          <span className="text-sm text-gray-500">
            min ({LIMITS.minMinutes}-{LIMITS.maxMinutes})
          </span>
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
          checked={declared}
          onChange={(e) => setDeclared(e.target.checked)}
        />
        <span>
          <strong>I declare that I will not use any AI assistance</strong> (reading aids, drafting, rewriting or
          checking) in this session.
        </span>
      </label>

      {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      <button onClick={start} disabled={!declared || busy || !validMinutes} className={`${btnPrimary} mt-5 w-full sm:w-auto`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Start timed session
      </button>
      <p className="mt-2 text-xs text-gray-500">The timer starts immediately and the abstract is shown first.</p>
    </Card>
  )
}
