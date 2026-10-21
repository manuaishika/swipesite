import { getSafeServerSession } from '@/lib/safe-session'
import { LoginGate } from '@/components/auth/LoginGate'
import { prisma } from '@/lib/prisma'
import { ActivityFeed } from '@/components/feed/ActivityFeed'

export default async function FeedPage() {
  const session = await getSafeServerSession()

  if (!session) {
    return (
      <LoginGate
        title="Your feed"
        body="See what the researchers you follow are reading. Log in to see your feed."
        next="/feed"
      />
    )
  }

  // Get activities from users the current user follows
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      following: {
        include: {
          following: true,
        },
      },
    },
  })

  const followingIds = user?.following.map((f) => f.followingId) || []

  // Get recent activities
  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { userId: { in: followingIds } },
        { userId: session.user.id },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
      paper: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Activity Feed</h1>
      <ActivityFeed activities={activities} />
    </div>
  )
}
