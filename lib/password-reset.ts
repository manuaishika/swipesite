import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'

export const RESET_TTL_MS = 60 * 60 * 1000
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')

/** Creates a one-time token for the user (at most 3 per hour). Returns the raw token, or null if rate-limited. */
export async function createResetToken(userId: string): Promise<string | null> {
  const recent = await prisma.passwordReset.count({ where: { userId, createdAt: { gte: new Date(Date.now() - RESET_TTL_MS) } } })
  if (recent >= 3) return null
  const token = randomBytes(32).toString('base64url')
  await prisma.passwordReset.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } })
  return token
}

/** The reset row for a token if it is unused and unexpired. */
export async function validToken(token: string) {
  if (!token || token.length > 100) return null
  const row = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } })
  return row && !row.usedAt && row.expiresAt > new Date() ? row : null
}
