import { NextResponse } from 'next/server'
import { syncArxiv } from '@/lib/arxiv-sync'
import { pruneEvents } from '@/lib/metrics'
import { ALL_TARGET, CATEGORY_TARGETS, refreshStats } from '@/lib/research-stats'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Daily job (see vercel.json): pulls fresh papers from several arXiv categories.
// If CRON_SECRET is set in Vercel, Vercel sends it as a bearer token; we require it and always run.
// Without a secret anyone can call this URL, so it then only runs when the data is stale.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const pruned = await pruneEvents().catch(() => 0)
    const sync = await syncArxiv({ targets: 5, perTarget: 15, force: Boolean(secret) })
    // then keep the Landscape counts current with whatever time is left
    const research = await refreshStats([ALL_TARGET, ...CATEGORY_TARGETS], 25_000).catch((e) => ({ error: String(e) }))
    return NextResponse.json({ ...sync, prunedEvents: pruned, research })
  } catch (err) {
    console.error('cron arXiv sync failed:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
