import Link from 'next/link'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { getNiche } from '@/lib/niche'
import { ShareMap } from '@/components/swipe/ShareMap'
import { GuestNiche } from '@/components/swipe/GuestNiche'
import { NicheReport } from '@/components/swipe/NicheReport'
import { ActiveDiscussions } from '@/components/discussion/ActiveDiscussions'
import { safeLoad } from '@/lib/safe-load'
import { DbUnavailable } from '@/components/DbUnavailable'

export const dynamic = 'force-dynamic'

export default async function NichePage() {
  const session = await getSafeServerSession()
  // Visitors who aren't logged in see the analysis of the ratings kept in their browser.
  if (!session?.user?.id)
    return (
      <>
        <GuestNiche />
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <ActiveDiscussions limit={3} title="Discussions to join" />
        </div>
      </>
    )
  const userId = session.user.id

  const loaded = await safeLoad('niche', () =>
    Promise.all([
      getNiche(userId),
      prisma.user.findUnique({ where: { id: userId }, select: { username: true, shareNiche: true } }),
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
  const [niche, me, picks] = loaded

  // discussions in the categories this person rates highest, falling back to anything active
  const focusCodes = (niche.likely.length ? niche.likely : niche.categories.filter((c) => c.rate > niche.baseRate)).map((c) => c.code)

  return (
    <>
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
      <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        {me && niche.swipes > 0 && <ShareMap username={me.username} initial={me.shareNiche} />}
        <Link href="/recommendations" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          Papers recommended from your ratings →
        </Link>
        <ActiveDiscussions limit={3} title={focusCodes.length ? 'Discussions in your categories' : 'Discussions to join'} categories={focusCodes} />
      </div>
    </>
  )
}
