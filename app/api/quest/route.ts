import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { finishLesson, place } from '@/lib/quest/engine'
import { shapeById } from '@/lib/quest/tracks'
import { loadState, progressOf, saveState } from '@/lib/quest/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ guest: true })
  return NextResponse.json(await loadState(session.user.id))
}

/**
 * { action: "lesson", track, lessonId, score } or { action: "place", track, level, score }.
 * The same engine as the browser decides XP, unlocking and milestones.
 */
export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ error: 'Log in to save progress' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const shape = typeof body.track === 'string' ? shapeById(body.track) : null
  if (!shape) return NextResponse.json({ error: 'Unknown track' }, { status: 400 })
  const { stats, tracks } = await loadState(session.user.id)
  const p = progressOf(tracks, shape.id)
  const out =
    body.action === 'lesson'
      ? finishLesson(shape, stats, p, String(body.lessonId ?? ''), Number(body.score))
      : body.action === 'place'
        ? place(stats, p, Number(body.level), Number(body.score))
        : null
  if (!out) return NextResponse.json({ error: 'Not allowed' }, { status: 400 })
  await saveState(session.user.id, shape.id, out.stats, out.progress)
  return NextResponse.json(out)
}
