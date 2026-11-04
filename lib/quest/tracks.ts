/**
 * Tracks as the pages and API see them: the hand-written ones from bank.ts, plus a track for any
 * other arXiv category built from real abstracts in our database ("which paper is this from?"),
 * harder at each level: distractors from other fields, then the same field, then the same area.
 */
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { areaLabel, fieldOf } from '@/lib/niche-core'
import { keyPoints } from '@/lib/abstract-points'
import { TRACKS, trackById, trackForCategory, type Q, type Track } from './bank'
import { seededShuffle, type TrackShape } from './engine'

export const AREA_PREFIX = 'area-'

/** The track someone with this niche category should play. */
export const trackIdFor = (code: string) => trackForCategory(code)?.id ?? `${AREA_PREFIX}${code}`

export const isTrackId = (id: string) => Boolean(trackById(id)) || /^area-[a-z-]+(\.[A-Za-z-]+)?$/.test(id)

export const shapeOf = (t: Track): TrackShape => ({ id: t.id, lessonIds: t.levels.map((l) => l.lessons.map((x) => x.id)) })

/** Lesson ids of a generated track (known without loading papers, so the API can validate them). */
export const areaShape = (id: string): TrackShape => ({ id, lessonIds: [0, 1, 2].map((lv) => [`${id}-${lv}-1`, `${id}-${lv}-2`]) })

export function shapeById(id: string): TrackShape | null {
  const t = trackById(id)
  if (t) return shapeOf(t)
  return isTrackId(id) ? areaShape(id) : null
}

const excerpt = (abstract: string) => {
  const pts = keyPoints(abstract)
  const text = (pts.length ? pts.slice(0, 2).map((p) => p.text).join(' ') : abstract).replace(/\s+/g, ' ')
  return text.length > 320 ? `${text.slice(0, 317).trimEnd()}…` : text
}

/** Builds a generated track, or null when there aren't enough papers in the area yet. */
async function areaTrack(id: string): Promise<Track | null> {
  const code = id.slice(AREA_PREFIX.length)
  const field = fieldOf(code)
  const rows = await prisma.paper.findMany({
    where: { categories: { contains: `"${code}"` }, abstract: { not: '' } },
    orderBy: { createdAt: 'desc' },
    take: 40,
    select: { id: true, title: true, abstract: true, categories: true },
  })
  const own = rows.filter((r) => stringToArray(r.categories)[0] === code)
  if (own.length < 10) return null
  const others = await prisma.paper.findMany({
    where: { NOT: { categories: { contains: `"${code}"` } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { title: true, categories: true },
  })
  const sameField = others.filter((o) => fieldOf(stringToArray(o.categories)[0] ?? '').id === field.id).map((o) => o.title)
  const otherField = others.filter((o) => fieldOf(stringToArray(o.categories)[0] ?? '').id !== field.id).map((o) => o.title)
  const ownTitles = own.map((o) => o.title)

  const pools = [otherField.length >= 3 ? otherField : [...otherField, ...sameField], sameField.length >= 3 ? sameField : [...sameField, ...otherField], ownTitles]
  const levels = [0, 1, 2].map((lv) => {
    const papers = seededShuffle(own, `${id}-${lv}`).slice(0, 10)
    const qs: Q[] = papers.map((p) => {
      const wrong = seededShuffle(pools[lv].filter((t) => t !== p.title), `${p.id}-${lv}`).slice(0, 3)
      while (wrong.length < 3) wrong.push(ownTitles.find((t) => t !== p.title && !wrong.includes(t)) ?? '—')
      return [`Which paper is this from?\n\n${excerpt(p.abstract)}`, [p.title, wrong[0], wrong[1], wrong[2]], 0, `It’s “${p.title}”. Open it from your recommendations to read the whole abstract.`]
    })
    return {
      lessons: [1, 2].map((n) => ({
        id: `${id}-${lv}-${n}`,
        title: ['Spot the paper', 'Read like a reviewer', 'Know the area'][lv] + (n === 2 ? ' II' : ''),
        topics: [],
        q: qs.slice((n - 1) * 5, n * 5),
      })),
    }
  }) as unknown as Track['levels']
  if (levels.some((l) => l.lessons.some((x) => x.q.length < 5))) return null
  return { id, name: areaLabel(code), emoji: '📚', codes: [code], levels }
}

export async function loadTrack(id: string): Promise<Track | null> {
  return trackById(id) ?? (isTrackId(id) ? areaTrack(id).catch(() => null) : null)
}

export { TRACKS }
