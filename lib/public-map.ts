import { prisma } from '@/lib/prisma'
import { getNiche } from '@/lib/niche'

/** A person's research map, if they chose to share it. Only category-level aggregates leave. */
export async function getPublicMap(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, shareNiche: true, role: true, expertise: true },
  })
  if (!user?.shareNiche) return null
  const niche = await getNiche(user.id)
  return { user, niche }
}
