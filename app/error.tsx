'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white shadow rounded-2xl p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong on our side</h1>
        <p className="text-sm text-gray-600 mb-4">
          This page hit an error while loading. Trying again usually works. If it keeps happening, the error ID below
          lets us find the exact cause in the server logs (Vercel → Logs, search for the ID).
        </p>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-4">
            Error ID: <code className="px-1.5 py-0.5 bg-gray-100 rounded font-mono text-gray-800 select-all">{error.digest}</code>
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light"
          >
            Try again
          </button>
          <a href="/" className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Home
          </a>
        </div>
      </div>
    </div>
  )
}
