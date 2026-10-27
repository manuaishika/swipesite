import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { safeLoad } from '@/lib/safe-load'
import { isModerator } from '@/lib/forum-trust'
import { DbUnavailable } from '@/components/DbUnavailable'
import { ModerationActions, RoleForm } from '@/components/admin/ModerationActions'

export const dynamic = 'force-dynamic'

export default async function ModerationPage() {
  const session = await getSafeServerSession()
  if (!(await isModerator(session?.user).catch(() => false))) notFound()

  const data = await safeLoad('moderation', async () => {
    const [reported, experts] = await Promise.all([
      prisma.comment.findMany({
        where: { reports: { some: { resolvedAt: null } } },
        include: {
          user: { select: { username: true, name: true } },
          paper: { select: { id: true, title: true } },
          reports: { where: { resolvedAt: null }, select: { reason: true, createdAt: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      prisma.user.findMany({ where: { role: { in: ['expert', 'admin'] } }, select: { username: true, role: true, expertise: true } }),
    ])
    return { reported, experts }
  })
  if (!data) return <DbUnavailable />

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Moderation</h1>
        <Link href="/admin/metrics" className="text-sm font-medium text-primary hover:underline">Metrics →</Link>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-900">Reported posts · {data.reported.length}</h2>
        {data.reported.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Nothing waiting.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.reported.map((c) => (
              <li key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-xs text-gray-500">
                  {c.user.name || c.user.username} on{' '}
                  <Link href={`/paper/${c.paper.id}#c-${c.id}`} className="text-primary hover:underline">{c.paper.title}</Link>
                  {' · '}{c.status === 'hidden' ? <strong className="text-rose-700">hidden</strong> : 'visible'}
                </p>
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-gray-800">{c.content}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {c.reports.length} report{c.reports.length === 1 ? '' : 's'}: {Array.from(new Set(c.reports.map((r) => r.reason))).join(', ')} ·{' '}
                  {formatDistanceToNow(c.reports[0].createdAt, { addSuffix: true })}
                </p>
                <div className="mt-3"><ModerationActions commentId={c.id} hidden={c.status === 'hidden'} /></div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-900">Expert badges</h2>
        <p className="mt-1 text-sm text-gray-600">Experts get a badge next to their name in discussions. Verify who they are before granting it.</p>
        <div className="mt-3"><RoleForm /></div>
        {data.experts.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {data.experts.map((e) => (
              <li key={e.username} className="rounded-full bg-sky-50 px-3 py-1 text-sky-800">
                {e.username} · {e.role}{e.expertise ? ` · ${e.expertise}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
