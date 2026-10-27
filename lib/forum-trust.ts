import { prisma } from '@/lib/prisma'
import { isAdmin as isAdminEmail } from '@/lib/metrics'

export const REPORTS_TO_HIDE = 3
export const REPORT_REASONS = ['Spam or advertising', 'Rude or personal attack', 'Off-topic', 'Misleading or false', 'Real assessment material'] as const

/** Reputation: net votes on someone's posts and replies across the whole site. */
export async function reputationFor(userIds: string[]): Promise<Record<string, number>> {
  const ids = Array.from(new Set(userIds))
  if (!ids.length) return {}
  const [posts, replies] = await Promise.all([
    prisma.comment.groupBy({ by: ['userId'], where: { userId: { in: ids }, status: 'visible' }, _sum: { upvotes: true, downvotes: true } }),
    prisma.commentReply.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _sum: { upvotes: true, downvotes: true } }),
  ])
  const rep: Record<string, number> = {}
  for (const r of [...posts, ...replies]) rep[r.userId] = (rep[r.userId] ?? 0) + (r._sum.upvotes ?? 0) - (r._sum.downvotes ?? 0)
  return rep
}

/** Admins: anyone listed in ADMIN_EMAILS, or given the admin role. */
export async function isModerator(user: { id: string; email?: string | null } | null | undefined) {
  if (!user) return false
  if (isAdminEmail(user.email)) return true
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  return u?.role === 'admin'
}
