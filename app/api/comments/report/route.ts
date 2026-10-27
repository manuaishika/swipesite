import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { REPORT_REASONS, REPORTS_TO_HIDE } from '@/lib/forum-trust'

// Flag a discussion post. Once REPORTS_TO_HIDE different people report it, it's hidden for review.
export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { commentId, reason } = await request.json().catch(() => ({}))
  if (typeof commentId !== 'string' || !REPORT_REASONS.includes(reason)) {
    return NextResponse.json({ error: 'Pick a reason' }, { status: 400 })
  }
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } })
  if (!comment) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (comment.userId === session.user.id) return NextResponse.json({ error: "You can't report your own post" }, { status: 400 })

  await prisma.commentReport.upsert({
    where: { commentId_reporterId: { commentId, reporterId: session.user.id } },
    create: { commentId, reporterId: session.user.id, reason },
    update: { reason },
  })
  const open = await prisma.commentReport.count({ where: { commentId, resolvedAt: null } })
  let hidden = false
  if (open >= REPORTS_TO_HIDE) {
    await prisma.comment.update({ where: { id: commentId }, data: { status: 'hidden' } })
    hidden = true
  }
  return NextResponse.json({ ok: true, hidden })
}
