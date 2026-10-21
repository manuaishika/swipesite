import Link from 'next/link'
import { getSafeServerSession } from '@/lib/safe-session'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { PaperDetail } from '@/components/paper/PaperDetail'
import { PeerReviewThread } from '@/components/discussion/PeerReviewThread'
import { transformPaper } from '@/lib/paper-helpers'
import { DbUnavailable } from '@/components/DbUnavailable'

export const dynamic = 'force-dynamic'

export default async function PaperPage({ params }: { params: { id: string } }) {
  // Public: anyone can read a paper and its review thread; posting/voting needs an account.
  const session = await getSafeServerSession()
  const userId = session?.user?.id ?? null

  let data
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: params.id },
      include: {
        likes: {
          where: { liked: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
            // only the viewer's own vote (to highlight it); other voters stay private
            votes: { where: { userId: userId ?? '' }, select: { voteType: true, userId: true } },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!paper) {
      data = null
    } else {
      const [userLike, userSave] = userId
        ? await Promise.all([
            prisma.paperLike.findUnique({ where: { userId_paperId: { userId, paperId: paper.id } } }),
            prisma.savedPaper.findUnique({ where: { userId_paperId: { userId, paperId: paper.id } } }),
          ])
        : [null, null]
      data = { paper, userLike, userSave }
    }
  } catch (err) {
    console.error('[paper] data load failed:', err)
    return <DbUnavailable />
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-gray-500">Paper not found</p>
      </div>
    )
  }
  const { paper, userLike, userSave } = data

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/discussions" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Peer review
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
          <PaperDetail
            paper={transformPaper(paper)}
            userLiked={userLike?.liked || false}
            userSaved={Boolean(userSave)}
            userId={userId ?? ''}
            guest={!userId}
          />
        </div>
        <PeerReviewThread paperId={paper.id} posts={paper.comments} userId={userId} />
      </div>
    </div>
  )
}
