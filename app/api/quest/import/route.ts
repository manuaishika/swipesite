import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'
import { PER_LESSON, type QuestStatsState, type TrackProgress } from '@/lib/quest/engine'
import { shapeById } from '@/lib/quest/tracks'
import { loadState, saveState } from '@/lib/quest/store'
import { BADGES } from '@/lib/quest/engine'

// Merges quest progress made before signing up (kept in the browser) into the account.
export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const local = body?.stats as QuestStatsState | undefined
  const localTracks = (body?.tracks ?? {}) as Record<string, TrackProgress>
  if (!local || typeof local.xp !== 'number') return NextResponse.json({ error: 'Nothing to import' }, { status: 400 })
  const { stats, tracks } = await loadState(session.user.id)
  // Keep the better of each; XP is capped by what the imported lessons could have earned.
  const lessonsCount = Object.values(localTracks).reduce((n, t) => n + Object.keys(t?.lessons ?? {}).length, 0)
  const merged: QuestStatsState = {
    xp: stats.xp + Math.min(Math.max(0, Math.round(local.xp)), (lessonsCount + 3) * (PER_LESSON * 10 + 10)),
    streak: Math.max(stats.streak, Math.min(local.streak ?? 0, 365)),
    bestStreak: Math.max(stats.bestStreak, Math.min(local.bestStreak ?? 0, 365)),
    lastDay: [stats.lastDay, local.lastDay].filter(Boolean).sort().pop() ?? null,
    badges: Array.from(new Set([...stats.badges, ...(local.badges ?? []).filter((b) => b in BADGES)])),
  }
  let n = 0
  for (const [id, t] of Object.entries(localTracks).slice(0, 20)) {
    const shape = shapeById(id)
    if (!shape || !t) continue
    const valid = new Set(shape.lessonIds.flat())
    const cur = tracks[id] ?? { level: 0, placed: false, lessons: {} }
    const lessons = { ...cur.lessons }
    for (const [lid, score] of Object.entries(t.lessons ?? {})) {
      if (valid.has(lid) && Number.isInteger(score) && score >= 0 && score <= PER_LESSON) lessons[lid] = Math.max(lessons[lid] ?? 0, score)
    }
    await saveState(session.user.id, id, merged, { level: Math.max(cur.level, Math.min(2, Math.max(0, Number(t.level) || 0))), placed: true, lessons })
    n++
  }
  if (!n) await prisma.questStats.upsert({ where: { userId: session.user.id }, create: { userId: session.user.id, ...merged, badges: JSON.stringify(merged.badges) }, update: { ...merged, badges: JSON.stringify(merged.badges) } })
  return NextResponse.json({ ok: true, tracks: n })
}
