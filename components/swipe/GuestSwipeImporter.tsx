'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Check } from 'lucide-react'
import { readGuestSwipes, writeGuestSwipes } from '@/lib/guest-swipes'

/** After sign-in, saves any swipes made as a guest to the account (once), then refreshes. */
export function GuestSwipeImporter() {
  const { status } = useSession()
  const router = useRouter()
  const started = useRef(false)
  const [saved, setSaved] = useState(0)

  useEffect(() => {
    if (status !== 'authenticated' || started.current) return
    const swipes = readGuestSwipes()
    if (!swipes.length) return
    started.current = true
    ;(async () => {
      let ok = 0
      for (const s of swipes) {
        const res = await fetch('/api/papers/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paperId: s.paperId, liked: s.liked }),
        }).catch(() => null)
        if (res?.ok) ok++
      }
      writeGuestSwipes([])
      setSaved(ok)
      router.refresh()
      setTimeout(() => setSaved(0), 5000)
    })()
  }, [status, router])

  if (!saved) return null
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl">
      <Check className="h-4 w-4 text-emerald-400" /> Saved your {saved} guest swipe{saved === 1 ? '' : 's'} to your account
    </div>
  )
}
