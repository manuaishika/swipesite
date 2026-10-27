'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Link2, Loader2 } from 'lucide-react'

/** Paste an arXiv link to open (or start) the discussion on any paper. */
export function AddPaper() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) return
    setBusy(true)
    setError(null)
    const res = await fetch('/api/papers/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: value }),
    }).catch(() => null)
    const data = await res?.json().catch(() => null)
    setBusy(false)
    if (res?.ok && data?.id) router.push(`/paper/${data.id}#discussion`)
    else setError(data?.error ?? 'Something went wrong. Try again.')
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-4">
      <label htmlFor="add-paper" className="text-sm font-medium text-gray-900">Discuss any arXiv paper</label>
      <p className="mt-0.5 text-xs text-gray-500">Paste its link or id. If nobody has opened it here yet, we fetch it from arXiv.</p>
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="add-paper"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://arxiv.org/abs/2401.05566"
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button disabled={busy || !value.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Open
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </form>
  )
}
