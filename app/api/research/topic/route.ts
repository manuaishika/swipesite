import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { categoryTarget, readStats, refreshStats, topicTarget, ALL_TARGET } from '@/lib/research-stats'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const LIMIT_PER_HOUR = 12

/**
 * { q: "model context protocol" } -> yearly arXiv counts, where its recent papers are filed and how
 * many people wrote them. Cached for the month; new topics cost ~20 s of polite arXiv requests.
 */
export async function POST(request: Request) {
  const { q, anonId } = await request.json().catch(() => ({}))
  const t = typeof q === 'string' ? topicTarget(q) : null
  if (!t) return NextResponse.json({ error: 'Type a topic of a few words' }, { status: 400 })

  let stats = await readStats([t.key])
  let row = stats.get(t.key)
  const fresh = row?.data && row.data.windows.length >= t.windows && row.data.period === new Date().toISOString().slice(0, 7)

  if (!fresh) {
    const session = await getSafeServerSession()
    const who = session?.user?.id ?? (typeof anonId === 'string' ? anonId.slice(0, 64) : null)
    if (who) {
      const n = await prisma.appEvent.count({
        where: { name: 'topic_search', OR: [{ userId: who }, { anonId: who }], createdAt: { gte: new Date(Date.now() - 3600_000) } },
      })
      if (n >= LIMIT_PER_HOUR) return NextResponse.json({ error: 'That’s a lot of new topics for one hour. Try again later, or pick one already counted.' }, { status: 429 })
    }
    const r = await refreshStats([t], 50_000)
    if (r.busy) return NextResponse.json({ busy: true }, { status: 202 })
    if (r.errors.length) return NextResponse.json({ error: 'arXiv didn’t answer. Try again in a minute.' }, { status: 502 })
    await prisma.appEvent
      .create({ data: { name: 'topic_search', userId: session?.user?.id ?? null, anonId: session ? null : who, props: JSON.stringify({ q: t.label }) } })
      .catch(() => {})
    stats = await readStats([t.key])
    row = stats.get(t.key)
  }
  if (!row?.data) return NextResponse.json({ error: 'No data' }, { status: 500 })

  // Context for the "how niche" ladder: the category most of its recent papers are filed in, and all of arXiv.
  const home = row.data.sample?.where[0]?.code ?? null
  const ctx = await readStats([ALL_TARGET.key, ...(home ? [categoryTarget(home).key] : [])])
  return NextResponse.json({
    label: t.label,
    data: row.data,
    home: home ? { code: home, label: categoryTarget(home).label, last12: ctx.get(categoryTarget(home).key)?.data?.windows[0]?.count ?? null } : null,
    all: ctx.get(ALL_TARGET.key)?.data?.windows[0]?.count ?? null,
  })
}
