'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { reportError, track } from '@/lib/telemetry-client'

/** Records page views and uncaught browser errors (see /api/telemetry and /admin/metrics). */
export function Telemetry() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) track('page_view')
  }, [pathname])

  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError(e.error ?? e.message)
    const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason, { kind: 'unhandledrejection' })
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
