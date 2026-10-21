import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SwipeDeck } from '@/components/swipe/SwipeDeck'
import { transformPapers } from '@/lib/paper-helpers'
import { FetchArxivButton } from '@/components/paper/FetchArxivButton'
import { getNicheTally } from '@/lib/niche'
import { emptyTally, nicheFromTally, rankForNiche, type NicheTally } from '@/lib/niche-core'

export const dynamic = 'force-dynamic'

export default async function SwipePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  let papers: any[] = []
  let tally: NicheTally = emptyTally()
  let dbError: string | null = null

  try {
    tally = await getNicheTally(session.user.id)

    // Papers the user hasn't swiped on yet (either way).
    const swiped = await prisma.paperLike.findMany({
      where: { userId: session.user.id },
      select: { paperId: true },
    })

    const candidates = await prisma.paper.findMany({
      where: { id: { notIn: swiped.map((s) => s.paperId) } },
      include: { likes: { where: { liked: true }, select: { id: true } } },
      take: 80,
      orderBy: { createdAt: 'desc' },
    })

    // Once a niche has formed, lead with papers in it (with regular exploration cards mixed in).
    papers = rankForNiche(transformPapers(candidates), nicheFromTally(tally)).slice(0, 30)
  } catch (error: any) {
    console.error('Database error in swipe page:', error)
    dbError = error.message || 'Database connection failed'
  }

  if (dbError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Database Connection Error
          </h2>
          <p className="text-red-700 mb-4">
            {dbError.includes('SQLite') || dbError.includes('file:')
              ? "SQLite doesn't work on Vercel. You need to use PostgreSQL. Check /api/status for details."
              : dbError}
          </p>
          <Link
            href="/api/status"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Check Status →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Find your niche</h1>
        <p className="mt-1 text-gray-600">
          Read the abstract. Swipe right if you&apos;d want to work on it, left if not. Your niche builds as you go.
        </p>
      </div>
      {papers.length === 0 && tally.swipes === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-gray-900 text-lg font-semibold mb-2">No papers in the database yet</p>
          <p className="text-gray-500 mb-6">Fetch papers from arXiv to get started.</p>
          <FetchArxivButton />
        </div>
      ) : (
        <SwipeDeck initialPapers={papers} initialTally={tally} />
      )}
    </div>
  )
}
