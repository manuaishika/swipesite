import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { applySwipe, emptyTally, nicheFromTally } from '@/lib/niche-core'

const DAY = 86400_000
const WEEK = 7 * DAY

/**
 * The one number to hold the product to: weekly active contributors, people who in a given
 * week rated an abstract, posted or replied in a discussion, or submitted a practice critique.
 */
export async function activityByWeek(weeks = 8, now = new Date()) {
  const since = new Date(now.getTime() - weeks * WEEK)
  const [likes, comments, replies, subs, users] = await Promise.all([
    prisma.paperLike.findMany({ where: { createdAt: { gte: since } }, select: { userId: true, createdAt: true } }),
    prisma.comment.findMany({ where: { createdAt: { gte: since } }, select: { userId: true, createdAt: true } }),
    prisma.commentReply.findMany({ where: { createdAt: { gte: since } }, select: { userId: true, createdAt: true } }),
    prisma.practiceSubmission.findMany({ where: { submittedAt: { gte: since } }, select: { userId: true, submittedAt: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ])
  const bucket = (d: Date) => Math.floor((now.getTime() - d.getTime()) / WEEK) // 0 = this week
  const rows = Array.from({ length: weeks }, (_, i) => ({
    weekStart: new Date(now.getTime() - (i + 1) * WEEK),
    active: new Set<string>(),
    raters: new Set<string>(),
    discussers: new Set<string>(),
    practisers: new Set<string>(),
    ratings: 0,
    posts: 0,
    signups: 0,
  }))
  const add = (d: Date, f: (r: (typeof rows)[number]) => void) => {
    const b = bucket(d)
    if (b >= 0 && b < weeks) f(rows[b])
  }
  for (const l of likes) add(l.createdAt, (r) => (r.active.add(l.userId), r.raters.add(l.userId), r.ratings++))
  for (const c of [...comments, ...replies]) add(c.createdAt, (r) => (r.active.add(c.userId), r.discussers.add(c.userId), r.posts++))
  for (const s of subs) add(s.submittedAt, (r) => (r.active.add(s.userId), r.practisers.add(s.userId)))
  for (const u of users) add(u.createdAt, (r) => r.signups++)

  return rows
    .map((r, i) => {
      const prev = rows[i + 1]
      const retained = prev ? Array.from(prev.active).filter((id) => r.active.has(id)).length : null
      return {
        weekStart: r.weekStart,
        wac: r.active.size,
        raters: r.raters.size,
        discussers: r.discussers.size,
        practisers: r.practisers.size,
        ratings: r.ratings,
        posts: r.posts,
        signups: r.signups,
        // share of last week's active people who came back this week
        retention: prev && prev.active.size ? (retained ?? 0) / prev.active.size : null,
      }
    })
    .reverse()
}

/**
 * Does the niche method predict anything? For each person with enough ratings, estimate their
 * likely categories from their first two thirds of ratings, then compare how often they marked
 * papers interesting in the last third: inside those categories vs outside.
 */
export async function nicheValidation({ minRatings = 30 } = {}) {
  const likes = await prisma.paperLike.findMany({
    select: { userId: true, liked: true, createdAt: true, paper: { select: { categories: true, keywords: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const byUser = new Map<string, typeof likes>()
  for (const l of likes) byUser.set(l.userId, [...(byUser.get(l.userId) ?? []), l])

  let users = 0
  let inLiked = 0, inSeen = 0, outLiked = 0, outSeen = 0
  for (const rows of Array.from(byUser.values())) {
    if (rows.length < minRatings) continue
    const cut = Math.floor((rows.length * 2) / 3)
    let tally = emptyTally()
    for (const r of rows.slice(0, cut)) {
      tally = applySwipe(tally, { liked: r.liked, categories: stringToArray(r.paper.categories), keywords: stringToArray(r.paper.keywords) })
    }
    const predicted = new Set(nicheFromTally(tally).categories.filter((c) => c.status !== 'unlikely').slice(0, 2).map((c) => c.code))
    if (!predicted.size) continue
    users++
    for (const r of rows.slice(cut)) {
      const inside = predicted.has(stringToArray(r.paper.categories)[0])
      if (inside) (inSeen++, r.liked && inLiked++)
      else (outSeen++, r.liked && outLiked++)
    }
  }
  const inRate = inSeen ? inLiked / inSeen : null
  const outRate = outSeen ? outLiked / outSeen : null
  return { users, inSeen, outSeen, inRate, outRate, lift: inRate !== null && outRate ? inRate / outRate : null, minRatings }
}

export async function recentErrors(limit = 20) {
  const rows = await prisma.appEvent.findMany({ where: { name: 'client_error' }, orderBy: { createdAt: 'desc' }, take: limit })
  return rows.map((r) => ({ ...r, props: JSON.parse(r.props || '{}') as Record<string, string> }))
}

export async function trafficByDay(days = 14, now = new Date()) {
  const since = new Date(now.getTime() - days * DAY)
  const views = await prisma.appEvent.findMany({ where: { name: 'page_view', createdAt: { gte: since } }, select: { anonId: true, path: true, createdAt: true } })
  const visitors = new Set(views.map((v) => v.anonId).filter(Boolean)).size
  const paths = new Map<string, number>()
  for (const v of views) {
    const p = (v.path ?? '/').replace(/\/(paper|practice\/start|practice\/feedback|collaborations)\/[^/]+/, '/$1/[id]')
    paths.set(p, (paths.get(p) ?? 0) + 1)
  }
  return { views: views.length, visitors, top: Array.from(paths.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10) }
}

/** Keeps the events table small: page views and errors older than 90 days are dropped. */
export async function pruneEvents() {
  const { count } = await prisma.appEvent.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * DAY) } } })
  return count
}

export function isAdmin(email: string | null | undefined) {
  const list = (process.env.ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return Boolean(email && list.includes(email.toLowerCase()))
}
