// Signed-in quest progress in the database, in the engine's shapes.
import { prisma } from '@/lib/prisma'
import { emptyProgress, emptyStats, type QuestStatsState, type TrackProgress } from './engine'

const parse = <T>(s: string | null | undefined, d: T): T => {
  try {
    return s ? (JSON.parse(s) as T) : d
  } catch {
    return d
  }
}

export async function loadState(userId: string) {
  const [s, rows] = await Promise.all([
    prisma.questStats.findUnique({ where: { userId } }),
    prisma.questProgress.findMany({ where: { userId } }),
  ])
  const stats: QuestStatsState = s ? { xp: s.xp, streak: s.streak, bestStreak: s.bestStreak, lastDay: s.lastDay, badges: parse(s.badges, []) } : emptyStats()
  const tracks: Record<string, TrackProgress> = {}
  for (const r of rows) tracks[r.track] = { level: r.level, placed: true, lessons: parse(r.lessons, {}) }
  return { stats, tracks }
}

export const progressOf = (tracks: Record<string, TrackProgress>, id: string) => tracks[id] ?? emptyProgress()

export async function saveState(userId: string, track: string, stats: QuestStatsState, p: TrackProgress) {
  const s = { xp: stats.xp, streak: stats.streak, bestStreak: stats.bestStreak, lastDay: stats.lastDay, badges: JSON.stringify(stats.badges) }
  await prisma.$transaction([
    prisma.questStats.upsert({ where: { userId }, create: { userId, ...s }, update: s }),
    prisma.questProgress.upsert({
      where: { userId_track: { userId, track } },
      create: { userId, track, level: p.level, lessons: JSON.stringify(p.lessons) },
      update: { level: p.level, lessons: JSON.stringify(p.lessons) },
    }),
  ])
}
