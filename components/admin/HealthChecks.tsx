'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react'
import type { Check } from '@/lib/health'

const ICON = {
  ok: <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-label="OK" />,
  warn: <AlertTriangle className="h-5 w-5 text-amber-500" aria-label="Warning" />,
  fail: <XCircle className="h-5 w-5 text-rose-600" aria-label="Failing" />,
}

export function HealthChecks() {
  const [checks, setChecks] = useState<Check[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mail, setMail] = useState<string | null>(null)

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    const r = await fetch('/api/admin/health', { cache: 'no-store' }).catch(() => null)
    const d = await r?.json().catch(() => null)
    if (d?.checks) setChecks(d.checks)
    else setError(d?.error ?? 'Could not run the checks')
    setLoading(false)
  }, [])
  useEffect(() => {
    run()
  }, [run])

  const testEmail = async () => {
    setMail('Sending…')
    const r = await fetch('/api/admin/test-email', { method: 'POST' }).catch(() => null)
    const d = await r?.json().catch(() => null)
    setMail(r?.ok ? 'Sent: check your inbox.' : d?.error ?? 'Failed')
  }

  const counts = checks ? { ok: checks.filter((c) => c.status === 'ok').length, bad: checks.filter((c) => c.status !== 'ok').length } : null
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={run} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} {loading ? 'Checking… (about 10 s)' : 'Run checks again'}
        </button>
        <button onClick={testEmail} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Send me a test email</button>
        {mail && <span className="text-sm text-gray-600">{mail}</span>}
        {counts && <span className="ml-auto text-sm text-gray-500">{counts.ok} passing · {counts.bad} need attention</span>}
      </div>
      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {checks && (
        <ul className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {checks.map((c) => (
            <li key={c.id} className="flex gap-3 px-4 py-3">
              <span className="mt-0.5 shrink-0">{ICON[c.status]}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {c.label}
                  {c.ms !== undefined && <span className="ml-2 text-xs font-normal text-gray-400">{c.ms} ms</span>}
                </p>
                <p className="break-words text-sm text-gray-600">{c.detail}</p>
                {c.fix && <p className="mt-1 text-sm text-amber-800">→ {c.fix}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
