import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { isModerator } from '@/lib/forum-trust'

// { username, role: "member" | "expert" | "admin", expertise? } — grant or remove the expert badge.
export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!(await isModerator(session?.user))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { username, role, expertise } = await request.json().catch(() => ({}))
  if (typeof username !== 'string' || !['member', 'expert', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { username: username.trim() } })
  if (!user) return NextResponse.json({ error: 'No user with that username' }, { status: 404 })
  const exp = typeof expertise === 'string' && expertise.trim() ? expertise.trim().slice(0, 60) : null
  await prisma.user.update({ where: { id: user.id }, data: { role, expertise: role === 'member' ? null : exp } })
  return NextResponse.json({ ok: true })
}
