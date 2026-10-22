import { NextResponse } from 'next/server'
import { syncArxiv, syncStatus } from '@/lib/arxiv-sync'

// A sync can take a few requests at arXiv's polite pace (one per ~3s).
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Public: tells the client whether the deck needs stocking (cheap, no arXiv call). */
export async function GET() {
  try {
    const s = await syncStatus()
    return NextResponse.json({ papers: s.count, practice: s.practice, needed: s.needed })
  } catch (err) {
    console.error('sync status failed:', err)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }
}

/**
 * Public, but safe to call: it only fetches when the database is under-stocked or stale, never
 * more than one run at a time, and never twice within a minute.
 */
export async function POST() {
  try {
    return NextResponse.json(await syncArxiv())
  } catch (err) {
    console.error('arXiv sync failed:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
