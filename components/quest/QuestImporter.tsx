'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { LOCAL_KEY, readLocal } from './useQuest'

/** After signing in, moves quest progress made as a guest into the account (once). */
export function QuestImporter() {
  const { status } = useSession()
  const done = useRef(false)
  useEffect(() => {
    if (status !== 'authenticated' || done.current) return
    done.current = true
    const local = readLocal()
    if (!local.stats.xp && !Object.keys(local.tracks).length) return
    fetch('/api/quest/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(local) })
      .then((r) => {
        if (r.ok) localStorage.removeItem(LOCAL_KEY)
      })
      .catch(() => {})
  }, [status])
  return null
}
