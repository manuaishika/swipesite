import { createHmac, timingSafeEqual } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { sendEmail } from '@/lib/email'

const WEEK_MS = 7 * 24 * 3600 * 1000

export function siteUrl() {
  const u = process.env.NEXTAUTH_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  return u.replace(/\/$/, '')
}

const secret = () => process.env.NEXTAUTH_SECRET || process.env.CRON_SECRET || ''

/** Signed one-click unsubscribe token (no login needed to stop the emails). */
export function unsubscribeToken(userId: string) {
  return createHmac('sha256', secret()).update(`digest:${userId}`).digest('base64url')
}

export function checkUnsubscribeToken(userId: string, token: string) {
  if (!secret()) return false
  const a = Buffer.from(unsubscribeToken(userId))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

type Digest = {
  notifications: { title: string; href: string }[]
  papers: { id: string; title: string; category: string }[]
}

/** What goes into one person's weekly email; null when there is nothing worth sending. */
export async function buildDigest(userId: string, since: Date): Promise<Digest | null> {
  const [notifications, likes] = await Promise.all([
    prisma.notification.findMany({ where: { userId, readAt: null, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.paperLike.findMany({ where: { userId, liked: true }, select: { paperId: true, paper: { select: { categories: true } } }, orderBy: { createdAt: 'desc' }, take: 200 }),
  ])
  // their top categories, by papers marked interesting
  const counts = new Map<string, number>()
  for (const l of likes) for (const c of stringToArray(l.paper.categories).slice(0, 1)) counts.set(c, (counts.get(c) ?? 0) + 1)
  const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c)
  const seen = await prisma.paperLike.findMany({ where: { userId }, select: { paperId: true } })
  const fresh = top.length
    ? await prisma.paper.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - WEEK_MS) },
          id: { notIn: seen.map((s) => s.paperId) },
          OR: top.map((c) => ({ categories: { contains: `"${c}"` } })),
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, categories: true },
      })
    : []
  const papers = fresh.map((p) => ({ id: p.id, title: p.title, category: stringToArray(p.categories)[0] ?? '' }))
  if (!notifications.length && !papers.length) return null
  return { notifications: notifications.map((n) => ({ title: n.title, href: n.href })), papers }
}

export function renderDigest(d: Digest, userId: string, name: string) {
  const base = siteUrl()
  const unsub = secret() ? `${base}/api/digest/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}` : `${base}/notifications`
  const li = (href: string, text: string) => `<li style="margin:0 0 8px"><a href="${base}${href}" style="color:#1f5c5c">${esc(text)}</a></li>`
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;color:#1f2937">
<p>Hi ${esc(name)},</p>
${d.notifications.length ? `<h3 style="margin:20px 0 8px">Waiting for you</h3><ul style="padding-left:18px">${d.notifications.map((n) => li(n.href, n.title)).join('')}</ul>` : ''}
${d.papers.length ? `<h3 style="margin:20px 0 8px">New in your categories</h3><ul style="padding-left:18px">${d.papers.map((p) => li(`/paper/${p.id}`, `${p.title}${p.category ? ` (${p.category})` : ''}`)).join('')}</ul>` : ''}
<p style="margin-top:24px"><a href="${base}/swipe" style="background:#1f5c5c;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Rate this week's abstracts</a></p>
<p style="font-size:12px;color:#6b7280;margin-top:32px">You get this weekly from ResearchSwipe. <a href="${unsub}" style="color:#6b7280">Unsubscribe</a></p></div>`
  const text = [
    `Hi ${name},`,
    ...(d.notifications.length ? ['', 'Waiting for you:', ...d.notifications.map((n) => `- ${n.title}: ${base}${n.href}`)] : []),
    ...(d.papers.length ? ['', 'New in your categories:', ...d.papers.map((p) => `- ${p.title}: ${base}/paper/${p.id}`)] : []),
    '',
    `Unsubscribe: ${unsub}`,
  ].join('\n')
  return { html, text }
}

/** Sends the weekly digest to everyone due one. Returns counts for the cron log. */
export async function sendDigests({ limit = 200 } = {}) {
  const cutoff = new Date(Date.now() - WEEK_MS + 3600_000) // an hour of slack so a weekly cron never skips
  const users = await prisma.user.findMany({
    where: { emailDigest: true, OR: [{ lastDigestAt: null }, { lastDigestAt: { lt: cutoff } }] },
    select: { id: true, email: true, name: true, username: true, lastDigestAt: true },
    take: limit,
  })
  let sent = 0
  let empty = 0
  for (const u of users) {
    const d = await buildDigest(u.id, u.lastDigestAt ?? new Date(Date.now() - WEEK_MS))
    if (d) {
      const { html, text } = renderDigest(d, u.id, u.name || u.username)
      if (await sendEmail(u.email, 'Your week on ResearchSwipe', html, text)) sent++
    } else empty++
    await prisma.user.update({ where: { id: u.id }, data: { lastDigestAt: new Date() } })
  }
  return { considered: users.length, sent, empty }
}
