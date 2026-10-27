'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

/** Bell with the unread count; refreshes on navigation and every two minutes. */
export function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch('/api/notifications', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && setUnread(d.unread))
        .catch(() => {})
    load()
    const id = setInterval(load, 120_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [pathname])

  return (
    <Link
      href="/notifications"
      className="relative rounded-lg p-2 text-white/90 transition-colors hover:bg-white/10 hover:text-white"
      aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      title="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-semibold text-gray-900">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
