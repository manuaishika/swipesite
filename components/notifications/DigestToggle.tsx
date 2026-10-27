'use client'

import { useState } from 'react'

export function DigestToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial)
  const [busy, setBusy] = useState(false)
  const toggle = async () => {
    setBusy(true)
    const next = !on
    const res = await fetch('/api/digest/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailDigest: next }),
    }).catch(() => null)
    if (res?.ok) setOn(next)
    setBusy(false)
  }
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={on} onChange={toggle} disabled={busy} className="h-4 w-4 accent-primary" />
      Weekly email digest
    </label>
  )
}
