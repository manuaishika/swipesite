import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { isModerator } from '@/lib/forum-trust'

// { commentId, action: "hide" | "restore" | "dismiss" } — resolves all open reports on the post.
export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!(await isModerator(session?.user))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { commentId, action } = await request.json().catch(() => ({}))
  if (typeof commentId !== 'string' || !['hide', 'restore', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  await prisma.$transaction([
    ...(action === 'dismiss' ? [] : [prisma.comment.update({ where: { id: commentId }, data: { status: action === 'hide' ? 'hidden' : 'visible' } })]),
    prisma.commentReport.updateMany({ where: { commentId, resolvedAt: null }, data: { resolvedAt: new Date() } }),
  ])
  return NextResponse.json({ ok: true })
}
