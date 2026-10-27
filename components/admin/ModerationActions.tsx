'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ModerationActions({ commentId, hidden }: { commentId: string; hidden: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const act = async (action: 'hide' | 'restore' | 'dismiss') => {
    setBusy(true)
    await fetch('/api/admin/moderate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId, action }) }).catch(() => null)
    setBusy(false)
    router.refresh()
  }
  const btn = 'rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50'
  return (
    <div className="flex flex-wrap gap-2">
      {hidden ? (
        <button disabled={busy} onClick={() => act('restore')} className={`${btn} bg-primary text-white`}>Restore</button>
      ) : (
        <button disabled={busy} onClick={() => act('hide')} className={`${btn} bg-rose-600 text-white`}>Hide</button>
      )}
      <button disabled={busy} onClick={() => act(hidden ? 'hide' : 'dismiss')} className={`${btn} border border-gray-300 text-gray-700`}>
        {hidden ? 'Keep hidden' : 'Dismiss reports'}
      </button>
    </div>
  )
}

export function RoleForm() {
  const [msg, setMsg] = useState<string | null>(null)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const res = await fetch('/api/admin/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: f.get('username'), role: f.get('role'), expertise: f.get('expertise') }),
    }).catch(() => null)
    const d = await res?.json().catch(() => null)
    setMsg(res?.ok ? 'Saved.' : d?.error ?? 'Failed')
  }
  const input = 'rounded-lg border border-gray-300 px-3 py-2 text-sm'
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <input name="username" placeholder="username" required className={input} />
      <select name="role" className={input} defaultValue="expert">
        <option value="expert">Expert</option>
        <option value="admin">Admin</option>
        <option value="member">Member (remove badge)</option>
      </select>
      <input name="expertise" placeholder="e.g. PhD, interpretability" className={`${input} w-64`} />
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white">Save</button>
      {msg && <span className="text-sm text-gray-600">{msg}</span>}
    </form>
  )
}
