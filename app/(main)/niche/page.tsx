import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Compass, Layers, MessagesSquare } from 'lucide-react'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { getNiche } from '@/lib/niche'
import { areaLabel, NICHE_READY_AFTER } from '@/lib/niche-core'
import { NichePanel } from '@/components/swipe/NichePanel'

export const dynamic = 'force-dynamic'

export default async function NichePage() {
  const session = await getSafeServerSession()
  if (!session?.user?.id) redirect('/login')

  const [niche, picks] = await Promise.all([
    getNiche(session.user.id),
    prisma.paperLike.findMany({
      where: { userId: session.user.id, liked: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        paper: {
          select: {
            id: true,
            title: true,
            categories: true,
            _count: { select: { comments: true } },
            comments: { where: { userId: session.user.id }, select: { id: true }, take: 1 },
          },
        },
      },
    }),
  ])

  // Group picks under the niche area they belong to (by primary arXiv category).
  const order = new Map(niche.areas.map((a, i) => [a.label, i]))
  const groups = new Map<string, typeof picks>()
  for (const p of picks) {
    const label = areaLabel(stringToArray(p.paper.categories)[0] ?? '')
    groups.set(label, [...(groups.get(label) ?? []), p])
  }
  const grouped = Array.from(groups.entries()).sort(
    (a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99) || b[1].length - a[1].length
  )
  const top = niche.areas.slice(0, 3).map((a) => a.label)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg sm:p-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Compass className="h-4 w-4" /> My niche
        </div>
        {niche.ready ? (
          <>
            <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-4xl">{top[0]}</h1>
            {top.length > 1 && (
              <p className="mt-2 text-lg text-white/80">
                with a pull towards {top.slice(1).join(' and ')}
              </p>
            )}
            <p className="mt-4 max-w-2xl text-sm text-white/75">
              Based on {niche.swipes} swipes ({niche.likes} interested). Your swipe deck now leads with papers in these
              areas, with a few from outside mixed in so you keep exploring.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-4xl">Your niche is still forming</h1>
            <p className="mt-2 max-w-2xl text-white/80">
              {niche.swipesToReady > 0
                ? `Swipe ${niche.swipesToReady} more abstract${niche.swipesToReady === 1 ? '' : 's'} to reveal it.`
                : 'Swipe right on a few more papers you would want to work on.'}{' '}
              It takes about {NICHE_READY_AFTER} swipes.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/swipe" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary-50">
            <Layers className="h-4 w-4" /> Keep swiping
          </Link>
          <Link href="/discussions" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            <MessagesSquare className="h-4 w-4" /> Peer review
          </Link>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <NichePanel niche={niche} />
        </aside>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your picks</h2>
            <span className="text-sm text-gray-500">{picks.length} papers</span>
          </div>
          {picks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center">
              <p className="font-medium text-gray-900">No picks yet</p>
              <p className="mt-1 text-sm text-gray-500">Papers you swipe right on show up here, ready to discuss.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([label, items]) => (
                <div key={label}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    {label}
                    {top.includes(label) && niche.ready && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">niche</span>
                    )}
                    <span className="font-normal text-gray-400">{items.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map(({ paper }) => {
                      const reviewed = paper.comments.length > 0
                      return (
                        <div key={paper.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                          <Link href={`/paper/${paper.id}`} className="min-w-0 flex-1">
                            <span className="line-clamp-2 font-medium text-gray-900 hover:text-primary">{paper.title}</span>
                            <span className="mt-0.5 block text-xs text-gray-500">
                              {paper._count.comments} post{paper._count.comments === 1 ? '' : 's'} in the thread
                            </span>
                          </Link>
                          <Link
                            href={`/paper/${paper.id}#discussion`}
                            className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                              reviewed ? 'text-primary hover:bg-primary-50' : 'bg-primary text-white hover:bg-primary-light'
                            }`}
                          >
                            {reviewed ? 'Open thread' : 'Review it'} <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
