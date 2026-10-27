'use client'

import { useState } from 'react'
import { Check, Link2, Share2 } from 'lucide-react'

/** Opt-in public link to the research map. Only category-level results are shown there. */
export function ShareMap({ username, initial }: { username: string; initial: boolean }) {
  const [on, setOn] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const url = typeof window === 'undefined' ? `/u/${username}` : `${window.location.origin}/u/${username}`

  const toggle = async () => {
    setBusy(true)
    const res = await fetch('/api/niche/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ share: !on }) }).catch(() => null)
    if (res?.ok) setOn(!on)
    setBusy(false)
  }
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'My research map', url }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <Share2 className="h-5 w-5 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">Public research map</p>
        <p className="text-xs text-gray-500">
          {on ? 'Anyone with the link sees your categories and topics, not the papers you rated.' : 'Off. Turn it on to get a link you can share.'}
        </p>
      </div>
      {on && (
        <button onClick={share} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-light">
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? 'Link copied' : 'Share link'}
        </button>
      )}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={on} onChange={toggle} disabled={busy} className="h-4 w-4 accent-primary" /> Public
      </label>
    </div>
  )
}
