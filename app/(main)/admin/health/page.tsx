import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSafeServerSession } from '@/lib/safe-session'
import { isModerator } from '@/lib/forum-trust'
import { HealthChecks } from '@/components/admin/HealthChecks'

export const dynamic = 'force-dynamic'

// Admins only: live checks of settings, database, arXiv, email and scheduled jobs.
export default async function HealthPage() {
  const session = await getSafeServerSession()
  if (!(await isModerator(session?.user).catch(() => false))) notFound()
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Health</h1>
        <div className="flex gap-4 text-sm font-medium text-primary">
          <Link href="/admin/metrics" className="hover:underline">Metrics</Link>
          <Link href="/admin/moderation" className="hover:underline">Moderation</Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-600">Live checks against this deployment. Anything amber or red says what to do.</p>
      <HealthChecks />
    </div>
  )
}
