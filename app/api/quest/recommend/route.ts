import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { trackById } from '@/lib/quest/bank'
import { AREA_PREFIX, isTrackId } from '@/lib/quest/tracks'

export const dynamic = 'force-dynamic'

// What to read after a lesson: papers from the track's arXiv categories. Beginners get surveys,
// tutorials and overviews first; higher levels get the newest work.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('track') ?? ''
  const level = Math.min(2, Math.max(0, Number(url.searchParams.get('level')) || 0))
  if (!isTrackId(id)) return NextResponse.json({ papers: [] })
  const codes = trackById(id)?.codes ?? [id.slice(AREA_PREFIX.length)]
  const inTrack = { OR: codes.map((c) => ({ categories: { contains: `"${c}"` } })) }
  const select = { id: true, title: true } as const
  const intro =
    level === 0
      ? await prisma.paper.findMany({
          where: { AND: [inTrack, { OR: ['survey', 'tutorial', 'overview', 'introduction', 'review'].map((w) => ({ title: { contains: w, mode: 'insensitive' as const } })) }] },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select,
        })
      : []
  const recent = await prisma.paper.findMany({
    where: { ...inTrack, id: { notIn: intro.map((p) => p.id) } },
    orderBy: { createdAt: 'desc' },
    take: 3 - intro.length + 2,
    select,
  })
  return NextResponse.json({ papers: [...intro, ...recent].slice(0, 3) })
}
