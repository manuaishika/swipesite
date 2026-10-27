import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'

// { share: boolean } — turns the public research map at /u/<username> on or off.
export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { share } = await request.json().catch(() => ({}))
  if (typeof share !== 'boolean') return NextResponse.json({ error: 'share must be true or false' }, { status: 400 })
  const user = await prisma.user.update({ where: { id: session.user.id }, data: { shareNiche: share }, select: { username: true, shareNiche: true } })
  return NextResponse.json(user)
}
