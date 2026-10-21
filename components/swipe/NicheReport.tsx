import Link from 'next/link'
import { ArrowRight, Layers, MessagesSquare } from 'lucide-react'
import { categoryPath, fieldOf, METHOD, type Niche } from '@/lib/niche-core'
import { EvidenceRow, StageStepper } from './NichePanel'

export type NichePick = { id: string; title: string; categories: string[]; posts?: number; reviewed?: boolean }

const STAGE_TITLES = { explore: 'Explore broadly', narrow: 'Narrow down', focus: 'Focus' } as const
const pct = (x: number) => `${Math.round(x * 100)}%`

const METHOD_STEPS = [
  {
    stage: 'explore',
    title: '1. Explore broadly',
    body: `Rate at least ${METHOD.exploreMinRatings} abstracts from at least ${METHOD.exploreMinCategories} arXiv categories. The deck rotates through categories so early likes don't decide anything.`,
  },
  {
    stage: 'narrow',
    title: '2. Narrow down',
    body: `Each category gets an interest rate with a 90% range, compared with your own average. The deck shows more from the categories it is least sure about.`,
  },
  {
    stage: 'focus',
    title: '3. Focus',
    body: `A category counts as a likely niche only with at least ${METHOD.minRatingsForLikely} ratings and a range that sits above your average. Topics inside it show where to go deeper.`,
  },
] as const

export function NicheReport({ niche, picks, guest = false }: { niche: Niche; picks: NichePick[]; guest?: boolean }) {
  // Evidence grouped by arXiv field (as arXiv groups its categories).
  const byField = niche.fields.map((f) => ({ ...f, cats: niche.categories.filter((c) => fieldOf(c.code).id === f.id) }))

  // Picks grouped by full taxonomy path of their primary category.
  const groups = new Map<string, NichePick[]>()
  for (const p of picks) {
    const key = p.categories[0] ? categoryPath(p.categories[0]) : 'Uncategorised'
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  const likelyPaths = new Set(niche.likely.map((c) => categoryPath(c.code)))
  const grouped = Array.from(groups.entries()).sort(
    (a, b) => Number(likelyPaths.has(b[0])) - Number(likelyPaths.has(a[0])) || b[1].length - a[1].length
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg sm:p-10">
        <div className="max-w-md">
          <StageStepper niche={niche} onDark />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-white/70">
          Stage {niche.stageIndex} of 3 · {STAGE_TITLES[niche.stage]}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">
          {niche.stage === 'focus'
            ? `Evidence points to ${niche.likely.map((c) => c.name).slice(0, 2).join(' and ')}`
            : niche.swipes === 0
              ? 'Start by rating abstracts across arXiv'
              : 'Building evidence across categories'}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-white/85">{niche.nextStep}</p>
        {niche.swipes > 0 && (
          <p className="mt-3 text-sm text-white/70">
            {niche.swipes} papers rated · {niche.categories.length} categories seen · {pct(niche.baseRate)} rated interesting
            overall
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/swipe" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary-50">
            <Layers className="h-4 w-4" /> {niche.swipes ? 'Rate more abstracts' : 'Start rating'}
          </Link>
          {guest ? (
            niche.swipes > 0 && (
              <Link href="/register?next=/niche" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                Save my progress <ArrowRight className="h-4 w-4" />
              </Link>
            )
          ) : (
            <Link href="/discussions" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              <MessagesSquare className="h-4 w-4" /> Peer review
            </Link>
          )}
        </div>
      </section>

      {/* the method */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">How this works</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {METHOD_STEPS.map((s) => (
            <div
              key={s.stage}
              className={`rounded-2xl border p-4 ${s.stage === niche.stage ? 'border-primary bg-primary-50/60' : 'border-gray-200 bg-white'}`}
            >
              <p className="font-semibold text-gray-900">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Evidence by arXiv category</h2>
            {niche.swipes > 0 && <span className="text-xs text-gray-500">line = your average ({pct(niche.baseRate)})</span>}
          </div>
          {byField.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-sm text-gray-600">
              No ratings yet. Each abstract you rate adds a data point to its arXiv category.
            </div>
          ) : (
            <div className="space-y-4">
              {byField.map((f) => (
                <div key={f.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{f.label}</h3>
                    <span className="text-xs tabular-nums text-gray-500">
                      {Math.round(f.seen)} rated · {pct(f.rate)} interesting
                    </span>
                  </div>
                  <ul className="mt-3 space-y-3.5">
                    {f.cats.map((c) => (
                      <EvidenceRow key={c.code} c={c} baseRate={niche.baseRate} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {niche.topics.length > 0 && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                Topics in your {niche.likely.length ? 'likely niche' : 'leading categories'}
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {niche.topics.map((k) => (
                  <span key={k.term} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                    {k.term} · {k.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Papers you marked interesting</h2>
            <span className="text-sm text-gray-500">{picks.length}</span>
          </div>
          {picks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-sm text-gray-600">
              Papers you swipe right on are listed here, sorted by arXiv category.
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(([path, items]) => (
                <div key={path}>
                  <h3 className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-700">
                    {path}
                    {likelyPaths.has(path) && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">likely niche</span>
                    )}
                    <span className="font-normal text-gray-400">{items.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {items.map((p) => (
                      <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <Link href={`/paper/${p.id}`} className="min-w-0 flex-1">
                          <span className="line-clamp-2 font-medium text-gray-900 hover:text-primary">{p.title}</span>
                          {p.posts !== undefined && (
                            <span className="mt-0.5 block text-xs text-gray-500">
                              {p.posts} post{p.posts === 1 ? '' : 's'} in the thread
                            </span>
                          )}
                        </Link>
                        <Link
                          href={`/paper/${p.id}#discussion`}
                          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                            guest || p.reviewed ? 'text-primary hover:bg-primary-50' : 'bg-primary text-white hover:bg-primary-light'
                          }`}
                        >
                          {guest ? 'Read reviews' : p.reviewed ? 'Open thread' : 'Review it'} <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ))}
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
