import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { fetchArxivPapersByIds } from '@/lib/arxiv'
import { savePaper } from '@/lib/arxiv-sync'
import { parseArxivId } from '@/lib/arxiv-id'

export const dynamic = 'force-dynamic'

// { input: "https://arxiv.org/abs/2401.05566" } -> { id } of our paper page (fetched from arXiv if new).
export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ error: 'Log in to add a paper' }, { status: 401 })
  const { input } = await request.json().catch(() => ({}))
  const arxivId = typeof input === 'string' ? parseArxivId(input) : null
  if (!arxivId) return NextResponse.json({ error: "That doesn't look like an arXiv link or id" }, { status: 400 })

  const known = await prisma.paper.findFirst({
    where: { OR: [{ arxivId }, { arxivId: { startsWith: `${arxivId}v` } }] },
    select: { id: true },
  })
  if (known) return NextResponse.json({ id: known.id, created: false })

  // Light per-user limit: 20 new papers an hour (counted from the AppEvent log).
  const recent = await prisma.appEvent.count({
    where: { name: 'paper_import', userId: session.user.id, createdAt: { gte: new Date(Date.now() - 3600_000) } },
  })
  if (recent >= 20) return NextResponse.json({ error: 'Too many new papers this hour. Try again later.' }, { status: 429 })

  let papers
  try {
    papers = await fetchArxivPapersByIds([arxivId])
  } catch (err) {
    console.error('[import] arXiv request failed:', err)
    return NextResponse.json({ error: 'arXiv did not respond. Try again in a minute.' }, { status: 502 })
  }
  // arXiv answers unknown ids with an "Error" entry rather than an empty list
  const bare = (x: { id: string }) => x.id.replace(/v\d+$/, '')
  const p = papers.find((x) => bare(x) === arxivId || arxivId.endsWith(`/${bare(x)}`))
  if (!p) return NextResponse.json({ error: `arXiv has no paper ${arxivId}` }, { status: 404 })
  const saved = await savePaper(p)
  await prisma.appEvent.create({ data: { name: 'paper_import', userId: session.user.id, props: JSON.stringify({ arxivId }) } })
  return NextResponse.json(saved)
}
