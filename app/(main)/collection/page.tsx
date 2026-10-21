import { getSafeServerSession } from '@/lib/safe-session'
import { LoginGate } from '@/components/auth/LoginGate'
import { prisma } from '@/lib/prisma'
import { transformPaper } from '@/lib/paper-helpers'
import { stringToArray } from '@/lib/json-helpers'
import { displayKeywords } from '@/lib/abstract-points'
import Link from 'next/link'
import { BookOpen, ExternalLink } from 'lucide-react'

export default async function CollectionPage({ searchParams }: { searchParams: { tag?: string } }) {
  const session = await getSafeServerSession()

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

  // Each saved paper carries the user's tags; liked papers that were auto-saved have none.
  const items = savedPapers.map((sp) => ({ paper: transformPaper(sp.paper), tags: stringToArray(sp.tags) }))
  const allTags = Array.from(new Set(items.flatMap((i) => i.tags))).sort()
  const activeTag = searchParams.tag && allTags.includes(searchParams.tag) ? searchParams.tag : null
  const shown = activeTag ? items.filter((i) => i.tags.includes(activeTag)) : items
  const chip = (on: boolean) =>
    `rounded-full px-3 py-1 text-sm font-medium ${on ? 'bg-primary text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-primary'}`

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Collection</h1>
        <p className="mt-1 text-gray-600">Papers you saved for later or marked interesting.</p>
      </div>

      {allTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/collection" className={chip(!activeTag)}>
            All {items.length}
          </Link>
          {allTags.map((t) => (
            <Link key={t} href={`/collection?tag=${encodeURIComponent(t)}`} className={chip(activeTag === t)}>
              {t} {items.filter((i) => i.tags.includes(t)).length}
            </Link>
          ))}
        </div>
      )}

      {shown.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shown.map(({ paper, tags }) => (
            <div key={paper.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              {tags.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span key={t} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <h3 className="line-clamp-2 font-semibold leading-snug text-gray-900">{paper.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{paper.abstract}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {displayKeywords(paper.keywords, 3).map((k: string) => (
                  <span key={k} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {k}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex gap-2 pt-4">
                <Link
                  href={`/paper/${paper.id}`}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-light"
                >
                  Open
                </Link>
                {paper.pdfUrl && (
                  <a
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
                    aria-label="PDF"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 py-12 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-gray-700">Nothing saved yet</p>
          <p className="mt-1 text-sm text-gray-500">Use &ldquo;Save for later&rdquo; on a card while you rate abstracts.</p>
          <Link href="/swipe" className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-light">
            Rate abstracts
          </Link>
        </div>
      )}
    </div>
  )
}
