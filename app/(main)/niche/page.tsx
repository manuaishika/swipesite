import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { getNiche } from '@/lib/niche'
import { GuestNiche } from '@/components/swipe/GuestNiche'
import { NicheReport } from '@/components/swipe/NicheReport'
import { safeLoad } from '@/lib/safe-load'
import { DbUnavailable } from '@/components/DbUnavailable'

export const dynamic = 'force-dynamic'

export default async function NichePage() {
  const session = await getSafeServerSession()
  // Visitors who aren't logged in see the analysis of the ratings kept in their browser.
  if (!session?.user?.id) return <GuestNiche />
  const userId = session.user.id

  const loaded = await safeLoad('niche', () =>
    Promise.all([
      getNiche(userId),
      prisma.paperLike.findMany({
        where: { userId, liked: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          paper: {
            select: {
              id: true,
              title: true,
              categories: true,
              _count: { select: { comments: true } },
              comments: { where: { userId, kind: 'review' }, select: { id: true }, take: 1 },
            },
          },
        },
      }),
    ]),
  )
  if (!loaded) return <DbUnavailable />
  const [niche, picks] = loaded

  return (
    <NicheReport
      niche={niche}
      picks={picks.map(({ paper }) => ({
        id: paper.id,
        title: paper.title,
        categories: stringToArray(paper.categories),
        posts: paper._count.comments,
        reviewed: paper.comments.length > 0,
      }))}
    />
  )
}
