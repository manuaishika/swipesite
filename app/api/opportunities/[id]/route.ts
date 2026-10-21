import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'

// Only the person who posted an opportunity can remove it.
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSafeServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const res = await prisma.opportunity.deleteMany({ where: { id: params.id, userId: session.user.id } })
  if (res.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
