import { NextResponse } from 'next/server'
import { ALL_TARGET, CATEGORY_TARGETS, refreshStats, type StatTarget } from '@/lib/research-stats'
import { backgroundById, bridgeTarget } from '@/lib/bridges'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Public, safe to call: it only counts areas not yet counted this month, one refresh at a time
 * across all servers, at arXiv's pace. { scope: "landscape" } or { scope: "bridges", background }.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  let targets: StatTarget[] = []
  if (body.scope === 'landscape') targets = [ALL_TARGET, ...CATEGORY_TARGETS]
  else if (body.scope === 'bridges') {
    const bg = backgroundById(body.background)
    if (!bg) return NextResponse.json({ error: 'Unknown background' }, { status: 400 })
    targets = bg.bridges.map(bridgeTarget)
  } else return NextResponse.json({ error: 'Unknown scope' }, { status: 400 })
  try {
    return NextResponse.json(await refreshStats(targets, 40_000))
  } catch (err) {
    console.error('[research] refresh failed:', err)
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
