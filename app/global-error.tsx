'use client'

import { useEffect } from 'react'
import { reportError } from '@/lib/telemetry-client'

// Last-resort boundary for errors in the root layout itself.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: 'global' })
  }, [error])
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '20vh auto', padding: '0 16px', color: '#1f2937' }}>
        <h1 style={{ fontSize: 20 }}>Something went wrong</h1>
        <p>The error has been reported{error.digest ? ` (ID ${error.digest})` : ''}.</p>
        <button onClick={() => reset()} style={{ padding: '8px 14px', borderRadius: 8, background: '#1f5c5c', color: '#fff', border: 0 }}>
          Try again
        </button>
      </body>
    </html>
  )
}
