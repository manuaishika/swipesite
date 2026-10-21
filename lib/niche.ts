import { prisma } from './prisma'
import { stringToArray } from './json-helpers'
import { applySwipe, emptyTally, nicheFromTally, type Niche, type NicheTally } from './niche-core'

/** Builds the user's niche tally from their swipe history (most recent 1000 swipes). */
export async function getNicheTally(userId: string): Promise<NicheTally> {
  const swipes = await prisma.paperLike.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 1000,
    select: { liked: true, paper: { select: { categories: true, keywords: true } } },
  })
  return swipes.reduce(
    (t, s) =>
      applySwipe(t, {
        liked: s.liked,
        categories: stringToArray(s.paper.categories),
        keywords: stringToArray(s.paper.keywords),
      }),
    emptyTally()
  )
}

export async function getNiche(userId: string): Promise<Niche> {
  return nicheFromTally(await getNicheTally(userId))
}
