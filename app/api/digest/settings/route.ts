import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { emailDigest } = await request.json().catch(() => ({}))
  if (typeof emailDigest !== 'boolean') return NextResponse.json({ error: 'emailDigest must be true or false' }, { status: 400 })
  await prisma.user.update({ where: { id: session.user.id }, data: { emailDigest } })
  return NextResponse.json({ ok: true, emailDigest })
}
