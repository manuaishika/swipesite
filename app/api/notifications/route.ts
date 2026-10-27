import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET: latest notifications and the unread count. POST { ids?: string[] }: mark read (all if no ids).
export async function GET() {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ unread: 0, items: [] })
  const userId = session.user.id
  const [unread, items] = await Promise.all([
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
  ])
  return NextResponse.json({ unread, items })
}

export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string').slice(0, 100) : null
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
