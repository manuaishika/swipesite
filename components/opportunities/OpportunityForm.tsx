'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { OPPORTUNITY_TYPES } from '@/lib/opportunities'

const input =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

export function OpportunityForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const body = Object.fromEntries(new FormData(e.currentTarget).entries())
    const res = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    setBusy(false)
    if (!res?.ok) return setError(data.error || 'Could not post')
    setOpen(false)
    router.refresh()
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light">
        <Plus className="h-4 w-4" /> Post an opportunity
      </button>
    )

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium text-gray-700">Title</span>
          <input name="title" required maxLength={120} className={`${input} mt-1`} placeholder="e.g. Summer research internship" />
        </label>
        <label className="text-sm">
          <span className="font-medium text-gray-700">Organization</span>
          <input name="organization" required maxLength={120} className={`${input} mt-1`} placeholder="Lab, university or company" />
        </label>
        <label className="text-sm">
          <span className="font-medium text-gray-700">Type</span>
          <select name="type" className={`${input} mt-1`} defaultValue="internship">
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-gray-700">Deadline (optional)</span>
          <input name="deadline" type="date" className={`${input} mt-1`} />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-gray-700">Link to the official posting</span>
          <input name="url" type="url" required maxLength={500} className={`${input} mt-1`} placeholder="https://" />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="font-medium text-gray-700">Description</span>
          <textarea name="description" required maxLength={2000} rows={3} className={`${input} mt-1`} placeholder="Who it's for, what you'd work on, how to apply" />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-light disabled:opacity-50">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Post
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function RemoveOpportunity({ id }: { id: string }) {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        if (!confirm('Remove this opportunity?')) return
        const res = await fetch(`/api/opportunities/${id}`, { method: 'DELETE' }).catch(() => null)
        if (res?.ok) router.refresh()
      }}
      className="text-xs text-gray-500 hover:text-red-600"
    >
      Remove
    </button>
  )
}
