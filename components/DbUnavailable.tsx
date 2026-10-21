import Link from 'next/link'
import { RefreshCw } from 'lucide-react'

/** Friendly fallback when the database can't be reached (e.g. it's waking up), instead of a crash. */
export function DbUnavailable() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">We couldn&apos;t load this right now</h1>
      <p className="mt-2 text-gray-600">
        The database didn&apos;t respond. This is usually temporary, so try again in a few seconds.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <a href="" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-light">
          <RefreshCw className="h-4 w-4" /> Try again
        </a>
        <Link href="/" className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
          Home
        </Link>
      </div>
    </div>
  )
}
