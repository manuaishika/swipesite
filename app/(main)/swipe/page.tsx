import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { SwipeDeck } from '@/components/swipe/SwipeDeck'
import { transformPapers } from '@/lib/paper-helpers'
import { stringToArray } from '@/lib/json-helpers'
import { FetchArxivButton } from '@/components/paper/FetchArxivButton'
import { getNicheTally } from '@/lib/niche'
import { FIELDS, emptyTally, fieldOf, nicheFromTally, orderDeck, type NicheTally } from '@/lib/niche-core'

export const dynamic = 'force-dynamic'

// Categories are stored as a JSON array string, e.g. ["cs.CL","cs.LG"]; match any code in the field.
function fieldWhere(fieldId: string | undefined): Prisma.PaperWhereInput {
  const field = FIELDS.find((f) => f.id === fieldId)
  if (!field) return {}
  // an archive appears either with a subcategory ("cs.CL") or on its own ("quant-ph")
  return { OR: field.archives.flatMap((a) => [{ categories: { contains: `"${a}.` } }, { categories: { contains: `"${a}"` } }]) }
}

/** How many papers each arXiv field has (by primary category), for the field filter. */
async function fieldCounts() {
  const rows = await prisma.paper.findMany({ select: { categories: true }, take: 5000 })
  const counts = new Map<string, number>()
  for (const r of rows) {
    const primary = stringToArray(r.categories)[0]
    if (!primary) continue
    const f = fieldOf(primary).id
    counts.set(f, (counts.get(f) ?? 0) + 1)
  }
  return FIELDS.filter((f) => counts.get(f.id)).map((f) => ({ id: f.id, label: f.label, count: counts.get(f.id)! }))
}

function FieldFilter({ fields, active }: { fields: { id: string; label: string; count: number }[]; active?: string }) {
  if (fields.length < 2) return null
  const chip = (on: boolean) =>
    `shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${on ? 'bg-primary text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-primary'}`
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Sample from arXiv field</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/swipe" className={chip(!active)}>
          All fields
        </Link>
        {fields.map((f) => (
          <Link key={f.id} href={`/swipe?field=${f.id}`} className={chip(active === f.id)}>
            {f.label} <span className={active === f.id ? 'text-white/70' : 'text-gray-400'}>{f.count}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function SwipePage({ searchParams }: { searchParams: { field?: string } }) {
  const session = await getServerSession(authOptions)
  const field = FIELDS.some((f) => f.id === searchParams.field) ? searchParams.field : undefined

  // Guests can rate straight away; their ratings are saved to the account after sign-up.
  if (!session) {
    return <GuestSwipePage field={field} />
  }

  let papers: any[] = []
  let tally: NicheTally = emptyTally()
  let fields: { id: string; label: string; count: number }[] = []
  let dbError: string | null = null

  try {
    tally = await getNicheTally(session.user.id)
    fields = await fieldCounts()

    // Papers the user hasn't rated yet (either way).
    const swiped = await prisma.paperLike.findMany({
      where: { userId: session.user.id },
      select: { paperId: true },
    })

    const candidates = await prisma.paper.findMany({
      where: { id: { notIn: swiped.map((s) => s.paperId) }, ...fieldWhere(field) },
      include: { likes: { where: { liked: true }, select: { id: true } } },
      take: 120,
      orderBy: { createdAt: 'desc' },
    })

    // Order by the stage of the method: spread across categories first, then test the uncertain ones.
    papers = orderDeck(transformPapers(candidates), nicheFromTally(tally)).slice(0, 40)
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
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Rate abstracts</h1>
        <p className="mt-1 text-gray-600">
          Read the abstract. Swipe right if you&apos;d want to work on it, left if not. Each rating adds evidence to
          its arXiv category.
        </p>
      </div>
      <FieldFilter fields={fields} active={field} />
      {papers.length === 0 && tally.swipes === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <p className="text-gray-900 text-lg font-semibold mb-2">No papers in the database yet</p>
          <p className="text-gray-500 mb-6">Fetch papers from arXiv to get started.</p>
          <FetchArxivButton />
        </div>
      ) : (
        <SwipeDeck key={field ?? 'all'} initialPapers={papers} initialTally={tally} />
      )}
    </div>
  )
}

async function GuestSwipePage({ field }: { field?: string }) {
  let papers: any[] = []
  let fields: { id: string; label: string; count: number }[] = []
  try {
    const rows = await prisma.paper.findMany({
      where: fieldWhere(field),
      include: { likes: { where: { liked: true }, select: { id: true } } },
      take: 80,
      orderBy: { createdAt: 'desc' },
    })
    // Guests start in the explore stage: spread across categories.
    papers = orderDeck(transformPapers(rows), nicheFromTally(emptyTally()))
    fields = await fieldCounts()
  } catch (error) {
    console.error('Database error in guest swipe page:', error)
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Rate abstracts</h1>
        <p className="mt-1 text-gray-600">
          Read the abstract, swipe right if you&apos;d want to work on it, left if not. Each rating adds evidence to its
          arXiv category.
        </p>
      </div>
      <FieldFilter fields={fields} active={field} />
      {papers.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-gray-900">No papers to rate yet</p>
          <p className="mt-1 text-gray-500">
            <Link href="/register" className="font-semibold text-primary hover:underline">Sign up</Link> to pull
            papers in from arXiv.
          </p>
        </div>
      ) : (
        <SwipeDeck key={field ?? 'all'} initialPapers={papers} initialTally={emptyTally()} guest />
      )}
    </div>
  )
}
