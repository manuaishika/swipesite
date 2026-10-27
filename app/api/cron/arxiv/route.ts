import { NextResponse } from 'next/server'
import { syncArxiv } from '@/lib/arxiv-sync'
import { pruneEvents } from '@/lib/metrics'

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
    return NextResponse.json({ ...(await syncArxiv({ targets: 5, perTarget: 15, force: Boolean(secret) })), prunedEvents: pruned })
  } catch (err) {
    console.error('cron arXiv sync failed:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
