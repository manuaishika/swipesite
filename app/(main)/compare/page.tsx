import { getSafeServerSession } from '@/lib/safe-session'
import { LoginGate } from '@/components/auth/LoginGate'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { PaperComparison } from '@/components/compare/PaperComparison'

export default async function ComparePage() {
  const session = await getSafeServerSession()

  if (!session) {
    return (
      <LoginGate
        title="Compare papers"
        body="Compare puts the papers you've saved side by side. Log in to use it."
        next="/compare"
        demo="save"
      />
    )
  }

  // The user's saved papers, with what the site knows about each (no scores or verdicts).
  const saved = await prisma.savedPaper.findMany({
    where: { userId: session.user.id },
    select: {
      paper: {
        select: {
          id: true, title: true, abstract: true, authors: true, categories: true, keywords: true, publishedDate: true, url: true, arxivId: true,
          _count: { select: { likes: { where: { liked: true } }, comments: true } },
        },
      },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
  })
  const papers = saved.map(({ paper: p }) => ({
    id: p.id,
    title: p.title,
    abstract: p.abstract,
    authors: stringToArray(p.authors),
    categories: stringToArray(p.categories),
    keywords: stringToArray(p.keywords),
    published: p.publishedDate ? p.publishedDate.toISOString() : null,
    url: p.url || (p.arxivId ? `https://arxiv.org/abs/${p.arxivId}` : null),
    interested: p._count.likes,
    posts: p._count.comments,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">Compare papers</h1>
      <p className="mt-1 max-w-2xl text-gray-600">
        Two of your saved papers side by side: what each says it does, in the authors&apos; own words, and how people here responded. No scores; the judgement is yours.
      </p>
      <PaperComparison papers={papers} />
    </div>
  )
}
