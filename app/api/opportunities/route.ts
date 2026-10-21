import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { validateOpportunity } from '@/lib/opportunities'

const MAX_PER_DAY = 10

export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Log in to post an opportunity' }, { status: 401 })
  try {
    const v = validateOpportunity(await request.json().catch(() => null))
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
    const recent = await prisma.opportunity.count({
      where: { userId: session.user.id, createdAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } },
    })
    if (recent >= MAX_PER_DAY) return NextResponse.json({ error: 'Posting limit reached for today' }, { status: 429 })
    const opportunity = await prisma.opportunity.create({ data: { ...v.value, userId: session.user.id } })
    return NextResponse.json({ id: opportunity.id })
  } catch (err) {
    console.error('Error posting opportunity:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
