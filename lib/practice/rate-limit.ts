import type { Prisma } from '@prisma/client'
import { PracticeError } from './errors'
import { RATE_LIMITS, RATE_WINDOW_MS } from './constants'

export async function rateLimit(
  tx: Prisma.TransactionClient,
  userId: string,
  action: keyof typeof RATE_LIMITS
) {
  const since = new Date(Date.now() - RATE_WINDOW_MS)
  const n = await tx.practiceRateEvent.count({
    where: { userId, action, createdAt: { gt: since } },
  })
  if (n >= RATE_LIMITS[action]) {
    throw new PracticeError('Rate limit reached for this action. Please slow down and try again later.', 429)
  }
  await tx.practiceRateEvent.create({ data: { userId, action } })
  // opportunistic cleanup of old events for this user
  await tx.practiceRateEvent.deleteMany({
    where: { userId, createdAt: { lt: new Date(Date.now() - 24 * RATE_WINDOW_MS) } },
  })
}
