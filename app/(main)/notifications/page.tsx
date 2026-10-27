import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { safeLoad } from '@/lib/safe-load'
import { LoginGate } from '@/components/auth/LoginGate'
import { DbUnavailable } from '@/components/DbUnavailable'
import { DigestToggle } from '@/components/notifications/DigestToggle'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const session = await getSafeServerSession()
  if (!session) {
    return <LoginGate title="Notifications" body="Replies to your posts and new posts in threads you're part of show up here." next="/notifications" demo="review" />
  }
  const userId = session.user.id
  const data = await safeLoad('notifications', async () => {
    const [items, user] = await Promise.all([
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.user.findUnique({ where: { id: userId }, select: { emailDigest: true } }),
    ])
    // Opening the page counts as reading them; the list below still shows which were new.
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } })
    return { items, digest: user?.emailDigest ?? true }
  })
  if (!data) return <DbUnavailable />

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Notifications</h1>
        <DigestToggle initial={data.digest} />
      </div>
      {data.items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white/60 p-8 text-center text-sm text-gray-600">
          Nothing yet. When someone replies to you, or posts in a thread you&apos;re part of, it shows up here.
          <div className="mt-4">
            <Link href="/discussions" className="font-medium text-primary hover:underline">Find a discussion to join →</Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {data.items.map((n) => (
            <li key={n.id}>
              <Link href={n.href} className={`block px-4 py-3.5 hover:bg-gray-50 ${n.readAt ? '' : 'bg-primary-50/50'}`}>
                <span className="flex items-start gap-2">
                  {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="new" />}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">{n.title}</span>
                    {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-gray-600">{n.body}</span>}
                    <span className="mt-1 block text-xs text-gray-400">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
