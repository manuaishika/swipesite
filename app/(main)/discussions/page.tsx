import { getSafeServerSession } from '@/lib/safe-session'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Compass, Layers, MessagesSquare, PenLine } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { getNiche } from '@/lib/niche'
import { areaLabel } from '@/lib/niche-core'
import { VERDICTS, kindMeta, plural } from '@/lib/peer-review'
import { LoginToParticipate } from '@/components/auth/LoginGate'

export const dynamic = 'force-dynamic'

type Scope = 'all' | 'niche'

export default async function PeerReviewPage({ searchParams }: { searchParams: { scope?: string } }) {
  // Public: anyone can browse threads. Your picks and the niche filter need an account.
  const session = await getSafeServerSession()
  const userId = session?.user?.id ?? null
  const scope: Scope = userId && searchParams.scope === 'niche' ? 'niche' : 'all'

  let dbError: string | null = null
  let waiting: { id: string; title: string; categories: string; _count: { comments: number } }[] = []
  let threads: any[] = []
  let nicheCodes = new Set<string>()
  let nicheReady = false

  try {
    if (userId) {
      const niche = await getNiche(userId)
      nicheReady = niche.ready
      // "In my niche": likely-niche categories, or while still forming, the categories above your average.
      const focus = niche.likely.length ? niche.likely : niche.categories.filter((c) => c.rate > niche.baseRate).slice(0, 3)
      nicheCodes = new Set(focus.map((c) => c.code))

      // Papers you picked (swiped right) but haven't reviewed yet.
      const picks = await prisma.paperLike.findMany({
        where: { userId, liked: true, paper: { comments: { none: { userId, kind: 'review' } } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          paper: { select: { id: true, title: true, categories: true, _count: { select: { comments: true } } } },
        },
      })
      waiting = picks.map((p) => p.paper)
    }

    // Threads ordered by latest activity: newest post per paper.
    const latest = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      distinct: ['paperId'],
      take: 60,
      select: { paperId: true },
    })
    const ids = latest.map((l) => l.paperId)
    const [papers, kindCounts, verdictCounts] = await Promise.all([
      prisma.paper.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          title: true,
          categories: true,
          comments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, kind: true, createdAt: true, user: { select: { name: true, username: true } } },
          },
        },
      }),
      prisma.comment.groupBy({ by: ['paperId', 'kind'], where: { paperId: { in: ids } }, _count: { _all: true } }),
      prisma.comment.groupBy({
        by: ['paperId', 'verdict'],
        where: { paperId: { in: ids }, kind: 'review', verdict: { not: null } },
        _count: { _all: true },
      }),
    ])
    const byId = new Map(papers.map((p) => [p.id, p]))
    threads = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p: any) => {
        const kinds: Record<string, number> = {}
        kindCounts.filter((k) => k.paperId === p.id).forEach((k) => (kinds[k.kind] = k._count._all))
        const verdicts: Record<string, number> = {}
        verdictCounts.filter((v) => v.paperId === p.id).forEach((v) => (verdicts[v.verdict as string] = v._count._all))
        const codes = stringToArray(p.categories)
        const areas = Array.from(new Set(codes.map(areaLabel)))
        return { ...p, kinds, verdicts, areas, inNiche: codes.some((c) => nicheCodes.has(c)) }
      })
      .filter((t) => scope === 'all' || t.inNiche)
  } catch (error: any) {
    console.error('Database error in peer review page:', error)
    dbError = error.message || 'Database connection failed'
  }

  if (dbError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Database Connection Error</h2>
          <p className="text-red-700">{dbError}</p>
        </div>
      </div>
    )
  }

  const tab = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Peer review</h1>
          <p className="mt-1 max-w-2xl text-gray-600">
            You picked it, now argue about it. Review the papers you picked, ask questions, and see where other
            researchers land.
          </p>
        </div>
        <Link
          href="/swipe"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
        >
          <Layers className="h-4 w-4" /> Find more papers
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          {/* your picks, waiting for a review */}
          {!userId ? (
            <LoginToParticipate action="review the papers you pick" next="/discussions" />
          ) : (
            <section>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Your picks to review</h2>
                {waiting.length > 0 && (
                  <Link href="/niche" className="text-sm font-medium text-primary hover:underline">
                    All picks
                  </Link>
                )}
              </div>
              {waiting.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-5 text-sm text-gray-600">
                  Nothing waiting. Swipe right on papers you&apos;d want to work on and they&apos;ll show up here to
                  review.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {waiting.map((p) => (
                    <Link
                      key={p.id}
                      href={`/paper/${p.id}#discussion`}
                      className="group flex flex-col justify-between rounded-2xl border border-primary/20 bg-primary-50/50 p-4 transition hover:border-primary hover:bg-primary-50"
                    >
                      <div>
                        <span className="text-xs font-medium text-primary-700">
                          {areaLabel(stringToArray(p.categories)[0] ?? '')}
                        </span>
                        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-gray-900">{p.title}</h3>
                      </div>
                      <span className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {p._count.comments} post{p._count.comments === 1 ? '' : 's'}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-primary">
                          <PenLine className="h-4 w-4" /> Write a review
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* threads */}
          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Active threads</h2>
              {userId && (
                <div className="flex gap-1">
                  <Link href="/discussions" className={tab(scope === 'all')}>
                    All
                  </Link>
                  <Link href="/discussions?scope=niche" className={tab(scope === 'niche')}>
                    My categories
                  </Link>
                </div>
              )}
            </div>
            {scope === 'niche' && !nicheReady && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No category has enough evidence yet, so this uses the categories above your average so far.{' '}
                <Link href="/swipe" className="font-medium underline">
                  Keep swiping
                </Link>
              </p>
            )}
            {threads.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center">
                <MessagesSquare className="h-6 w-6 text-primary" />
                <p className="mt-2 font-medium text-gray-900">
                  No threads {scope === 'niche' ? 'in your categories ' : ''}yet
                </p>
                <p className="mt-1 text-sm text-gray-500">Open one of your picks and write the first review.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map((t) => {
                  const last = t.comments[0]
                  const total = Object.values(t.verdicts as Record<string, number>).reduce((a, b) => a + b, 0)
                  return (
                    <Link
                      key={t.id}
                      href={`/paper/${t.id}#discussion`}
                      className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary sm:p-5"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.inNiche && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                            your categories
                          </span>
                        )}
                        {t.areas.slice(0, 2).map((a: string) => (
                          <span
                            key={a}
                            className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                      <h3 className="mt-2 font-semibold leading-snug text-gray-900">{t.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>
                          {plural(t.kinds.review ?? 0, 'review')} · {plural(t.kinds.question ?? 0, 'question')} ·{' '}
                          {plural(t.kinds.discussion ?? 0, 'discussion post')}
                        </span>
                        {total > 0 && (
                          <span className="inline-flex items-center gap-2">
                            <span className="flex h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                              {VERDICTS.map((v) =>
                                t.verdicts[v.id] ? (
                                  <span
                                    key={v.id}
                                    className={v.bar}
                                    style={{ width: `${(t.verdicts[v.id] / total) * 100}%` }}
                                  />
                                ) : null,
                              )}
                            </span>
                            {VERDICTS.filter((v) => t.verdicts[v.id])
                              .map((v) => `${t.verdicts[v.id]} ${v.label.toLowerCase()}`)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                      {last && (
                        <p className="mt-3 line-clamp-2 border-l-2 border-gray-200 pl-3 text-sm text-gray-600">
                          <span className="font-medium text-gray-800">{last.user.name || last.user.username}</span>{' '}
                          <span className="text-gray-400">
                            ({kindMeta(last.kind).label.toLowerCase()},{' '}
                            {formatDistanceToNow(new Date(last.createdAt), { addSuffix: true })})
                          </span>
                          : {last.content.replace(/[*_#>`]/g, '').slice(0, 220)}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Writing a useful review</h2>
            <ol className="mt-3 space-y-2 text-sm text-gray-600">
              <li>
                <strong className="text-gray-800">1. Main claim.</strong> One sentence: what does the paper say it
                shows?
              </li>
              <li>
                <strong className="text-gray-800">2. Evidence.</strong> What was varied and measured, and does it
                support the claim?
              </li>
              <li>
                <strong className="text-gray-800">3. Gaps.</strong> What&apos;s missing, and what else could explain the
                result?
              </li>
              <li>
                <strong className="text-gray-800">4. Verdict.</strong> Promising, mixed or skeptical, and what would
                change your mind.
              </li>
            </ol>
          </div>
          <Link
            href="/practice"
            className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary"
          >
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <PenLine className="h-4 w-4 text-primary" /> Practice critiques
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Timed, structured critiques of AI safety abstracts, scored anonymously by two peers.
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Practise <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/niche"
            className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary"
          >
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Compass className="h-4 w-4 text-primary" /> My niche
            </div>
            <p className="mt-1 text-sm text-gray-600">Evidence by arXiv category and every paper you marked interesting.</p>
          </Link>
        </aside>
      </div>
    </div>
  )
}
