import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LoginGate } from '@/components/auth/LoginGate'
import { prisma } from '@/lib/prisma'
import { transformPapers } from '@/lib/paper-helpers'
import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'

export default async function CollectionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <LoginGate
        title="Your collection"
        body="Papers you swipe right on or save are kept here. Log in to see yours."
        next="/collection"
      />
    )
  }

  let savedPapers: any[] = []
  let dbError: string | null = null

  try {
    savedPapers = await prisma.savedPaper.findMany({
      where: { userId: session.user.id },
      include: {
        paper: {
          include: {
            likes: {
              where: { liked: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  } catch (error: any) {
    console.error('Database error in collection page:', error)
    dbError = error.message || 'Database connection failed'
  }

  if (dbError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
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

  const papers = transformPapers(savedPapers.map((sp) => sp.paper))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Collection</h1>
        <p className="text-gray-600">
          Papers you&apos;ve swiped right on and saved to your collection
        </p>
      </div>

      {papers.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                {paper.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{paper.abstract}</p>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {paper.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{paper.authors.slice(0, 2).join(', ')}</span>
                <span>{paper.likes.length} likes</span>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/paper/${paper.id}`}
                  className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  View Details
                </Link>
                {paper.pdfUrl && (
                  <a
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Your collection is empty</p>
          <p className="text-gray-400 mt-2 mb-6">
            Start swiping right on papers to build your collection!
          </p>
          <Link
            href="/swipe"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Swiping
          </Link>
        </div>
      )}
    </div>
  )
}
