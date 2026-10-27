import Link from 'next/link'
import { formatDistanceToNowStrict } from 'date-fns'
import { ArrowRight, MessagesSquare } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { areaLabel } from '@/lib/niche-core'
import { PhysicsCard, Stagger, StaggerItem } from '@/components/motion/Physics'

type Item = {
  id: string
  title: string
  category: string
  posts: number
  reviews: number
  lastAt: Date | null
}

/**
 * Discussions people can join right now: the most recently active threads, then papers that are
 * waiting for a first post (spread across arXiv categories). Always links to the paper's thread.
 * `categories` (arXiv codes) prefers papers in those categories, e.g. on a person's niche page.
 */
export async function ActiveDiscussions({
  limit = 3,
  title = 'Join a discussion',
  categories = [],
}: {
  limit?: number
  title?: string
  categories?: string[]
}) {
  let items: Item[] = []
  try {
    const catWhere = categories.length
      ? { OR: categories.map((c) => ({ categories: { contains: `"${c}"` } })) }
      : {}

    const groups = await prisma.comment.groupBy({
      by: ['paperId'],
      where: { status: 'visible' },
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      take: 30,
    })
    const ids = groups.map((g) => g.paperId)
    if (ids.length) {
      const [papers, reviewCounts] = await Promise.all([
        prisma.paper.findMany({ where: { id: { in: ids }, ...catWhere }, select: { id: true, title: true, categories: true } }),
        prisma.comment.groupBy({ by: ['paperId'], where: { paperId: { in: ids }, kind: 'review' }, _count: { _all: true } }),
      ])
      const byId = new Map(papers.map((p) => [p.id, p]))
      for (const g of groups) {
        const p = byId.get(g.paperId)
        if (!p) continue
        items.push({
          id: p.id,
          title: p.title,
          category: stringToArray(p.categories)[0] ?? '',
          posts: g._count._all,
          reviews: reviewCounts.find((r) => r.paperId === g.paperId)?._count._all ?? 0,
          lastAt: g._max.createdAt,
        })
        if (items.length >= limit) break
      }
    }

    if (items.length < limit) {
      // papers nobody has posted on yet, one per category first so the choice is varied
      const fresh = await prisma.paper.findMany({
        where: { comments: { none: {} }, id: { notIn: items.map((i) => i.id) }, ...catWhere },
        orderBy: { createdAt: 'desc' },
        take: 60,
        select: { id: true, title: true, categories: true },
      })
      const seen = new Set<string>()
      const pool = [...fresh]
      const pick = (distinct: boolean) => {
        for (const p of pool.slice()) {
          if (items.length >= limit) return
          const cat = stringToArray(p.categories)[0] ?? ''
          if (distinct && seen.has(cat)) continue
          seen.add(cat)
          pool.splice(pool.indexOf(p), 1)
          items.push({ id: p.id, title: p.title, category: cat, posts: 0, reviews: 0, lastAt: null })
        }
      }
      pick(true)
      pick(false)
    }
  } catch (err) {
    console.error('[ActiveDiscussions] load failed:', err)
    return null
  }
  if (items.length === 0) return null

  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <Link href="/discussions" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          All discussions <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <StaggerItem key={it.id}>
            <PhysicsCard href={`/paper/${it.id}#discussion`} className="h-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex h-full flex-col">
                {it.category && (
                  <span className="w-fit rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">{areaLabel(it.category)}</span>
                )}
                <h3 className="mt-2 line-clamp-3 font-medium leading-snug text-gray-900">{it.title}</h3>
                <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-gray-500">
                    <MessagesSquare className="h-4 w-4" />
                    {it.posts > 0
                      ? `${it.posts} post${it.posts === 1 ? '' : 's'}${it.reviews ? ` · ${it.reviews} review${it.reviews === 1 ? '' : 's'}` : ''}${
                          it.lastAt ? ` · ${formatDistanceToNowStrict(it.lastAt)} ago` : ''
                        }`
                      : 'No posts yet'}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
                    {it.posts > 0 ? 'Join' : 'Start it'} <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </PhysicsCard>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  )
}
