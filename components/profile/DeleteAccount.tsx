'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

export function DeleteAccount({ username }: { username: string }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    const res = await fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: value }) }).catch(() => null)
    if (res?.ok) return signOut({ callbackUrl: '/' })
    setError((await res?.json().catch(() => null))?.error ?? 'Failed')
    setBusy(false)
  }

  return (
    <section className="mt-10 rounded-2xl border border-rose-200 bg-white p-5">
      <h2 className="font-medium text-gray-900">Delete account</h2>
      <p className="mt-1 text-sm text-gray-600">Removes your account, ratings, saved papers, posts, replies and practice work. This can&apos;t be undone.</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="mt-3 rounded-lg border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50">
          Delete my account…
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Type ${username} to confirm`}
            aria-label="Type your username to confirm"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button disabled={busy || value !== username} onClick={remove} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            Delete permanently
          </button>
          {error && <span className="text-sm text-rose-700">{error}</span>}
        </div>
      )}
    </section>
  )
}
