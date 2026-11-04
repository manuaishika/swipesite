/**
 * Rules of the niche quests, shared by the browser (guests, instant feedback) and the server
 * (signed-in progress). Pure functions only.
 *
 * - A track has three levels with two lessons each, played in order. Five questions per lesson;
 *   4 or more right passes it and unlocks the next one.
 * - Placement: pick a level and answer five questions from it. 4+ right places you there, 2 or
 *   fewer places you one level lower; lessons below your level count as skipped.
 * - XP: 10 per right answer, +10 for a perfect lesson. A streak counts days in a row with at least
 *   one finished lesson (UTC days).
 */

export const PASS = 4
export const PER_LESSON = 5
export const LEVELS = 3

export type QuestStatsState = { xp: number; streak: number; bestStreak: number; lastDay: string | null; badges: string[] }
export type TrackProgress = { level: number; placed: boolean; lessons: Record<string, number> }
export type TrackShape = { id: string; lessonIds: string[][] } // lessonIds[level] = ids in order

export const emptyStats = (): QuestStatsState => ({ xp: 0, streak: 0, bestStreak: 0, lastDay: null, badges: [] })
export const emptyProgress = (): TrackProgress => ({ level: 0, placed: false, lessons: {} })

export const BADGES: Record<string, { label: string; emoji: string; detail: string }> = {
  placed: { label: 'Found your level', emoji: '🧭', detail: 'Took a placement test' },
  'first-lesson': { label: 'First steps', emoji: '🌱', detail: 'Finished your first lesson' },
  perfect: { label: 'Flawless', emoji: '💎', detail: 'Five out of five in a lesson' },
  'streak-3': { label: 'On a roll', emoji: '🔥', detail: '3-day streak' },
  'streak-7': { label: 'Week streak', emoji: '⚡', detail: '7-day streak' },
  'xp-100': { label: '100 XP', emoji: '⭐', detail: 'Earned 100 XP' },
  'xp-500': { label: '500 XP', emoji: '🌟', detail: 'Earned 500 XP' },
  'level-0': { label: 'Beginner cleared', emoji: '🥉', detail: 'Finished a beginner level' },
  'level-1': { label: 'Intermediate cleared', emoji: '🥈', detail: 'Finished an intermediate level' },
  'level-2': { label: 'Track mastered', emoji: '🏆', detail: 'Finished an advanced level' },
}

export const today = (d = new Date()) => d.toISOString().slice(0, 10)
const yesterdayOf = (day: string) => today(new Date(Date.parse(day + 'T00:00:00Z') - 86400_000))

export const xpFor = (score: number) => score * 10 + (score === PER_LESSON ? 10 : 0)

/** Where each lesson stands: done (passed or skipped by placement), the next one to play, or locked. */
export function lessonStates(shape: TrackShape, p: TrackProgress) {
  const out: Record<string, 'done' | 'skipped' | 'current' | 'locked'> = {}
  let foundCurrent = false
  shape.lessonIds.forEach((ids, level) => {
    for (const id of ids) {
      if (level < p.level) out[id] = (p.lessons[id] ?? 0) >= PASS ? 'done' : 'skipped'
      else if ((p.lessons[id] ?? 0) >= PASS) out[id] = 'done'
      else if (!foundCurrent) {
        out[id] = 'current'
        foundCurrent = true
      } else out[id] = 'locked'
    }
  })
  return out
}

export const levelDone = (shape: TrackShape, p: TrackProgress, level: number) =>
  shape.lessonIds[level].every((id) => (p.lessons[id] ?? 0) >= PASS || level < p.level)

function addBadges(stats: QuestStatsState, ids: string[]) {
  const earned = ids.filter((b) => !stats.badges.includes(b))
  return { stats: { ...stats, badges: [...stats.badges, ...earned] }, earned }
}

function bumpStreak(stats: QuestStatsState, day: string): QuestStatsState {
  if (stats.lastDay === day) return stats
  const streak = stats.lastDay === yesterdayOf(day) ? stats.streak + 1 : 1
  return { ...stats, streak, bestStreak: Math.max(stats.bestStreak, streak), lastDay: day }
}

export type Outcome = { stats: QuestStatsState; progress: TrackProgress; xp: number; passed: boolean; earned: string[]; levelCleared: number | null }

/** Records a finished lesson. Unknown lessons and locked ones are refused (returns null). */
export function finishLesson(shape: TrackShape, stats0: QuestStatsState, p0: TrackProgress, lessonId: string, score: number, day = today()): Outcome | null {
  const level = shape.lessonIds.findIndex((ids) => ids.includes(lessonId))
  if (level < 0 || !Number.isInteger(score) || score < 0 || score > PER_LESSON) return null
  const state = lessonStates(shape, p0)[lessonId]
  if (state === 'locked') return null
  const before = levelDone(shape, p0, level)
  const progress: TrackProgress = { ...p0, lessons: { ...p0.lessons, [lessonId]: Math.max(p0.lessons[lessonId] ?? 0, score) } }
  const xp = xpFor(score)
  let stats = bumpStreak({ ...stats0, xp: stats0.xp + xp }, day)
  const passed = score >= PASS
  const levelCleared = !before && levelDone(shape, progress, level) ? level : null
  const want = [
    'first-lesson',
    ...(score === PER_LESSON ? ['perfect'] : []),
    ...(stats.streak >= 3 ? ['streak-3'] : []),
    ...(stats.streak >= 7 ? ['streak-7'] : []),
    ...(stats.xp >= 100 ? ['xp-100'] : []),
    ...(stats.xp >= 500 ? ['xp-500'] : []),
    ...(levelCleared !== null ? [`level-${levelCleared}`] : []),
  ]
  const b = addBadges(stats, want)
  stats = b.stats
  return { stats, progress, xp, passed, earned: b.earned, levelCleared }
}

/** Records a placement test taken at `chosen` level with `score` right out of five. */
export function place(stats0: QuestStatsState, p0: TrackProgress, chosen: number, score: number, day = today()) {
  if (!Number.isInteger(chosen) || chosen < 0 || chosen >= LEVELS || !Number.isInteger(score) || score < 0 || score > PER_LESSON) return null
  const level = score >= PASS ? chosen : score <= 2 ? Math.max(0, chosen - 1) : chosen
  const progress: TrackProgress = { ...p0, level: p0.placed ? Math.max(p0.level, level) : level, placed: true }
  const b = addBadges(bumpStreak({ ...stats0, xp: stats0.xp + score * 5 }, day), ['placed'])
  return { stats: b.stats, progress, level, earned: b.earned, xp: score * 5 }
}

/** Deterministic shuffle (so server and browser render the same order). */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const rand = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return ((h >>> 0) % 100000) / 100000
  }
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
