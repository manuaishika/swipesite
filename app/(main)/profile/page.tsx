import { getSafeServerSession } from '@/lib/safe-session'
import { LoginGate } from '@/components/auth/LoginGate'
import { prisma } from '@/lib/prisma'
import { UserProfile } from '@/components/profile/UserProfile'
import { DeleteAccount } from '@/components/profile/DeleteAccount'
import { stringToArray } from '@/lib/json-helpers'
import { transformPapers, transformPaper } from '@/lib/paper-helpers'

export default async function ProfilePage() {
  const session = await getSafeServerSession()

  if (!session) {
    return (
      <LoginGate
        title="Your profile"
        body="Log in to see and edit your profile."
        next="/profile"
        demo="profile"
      />
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      likedPapers: {
        include: {
          paper: true,
        },
        where: { liked: true },
        take: 10,
      },
      savedPapers: {
        include: {
          paper: true,
        },
        take: 10,
      },
      _count: {
        select: {
          likedPapers: true,
          savedPapers: true,
          comments: true,
          collaborations: true,
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!user) {
    return <div>User not found</div>
  }

  // Transform user data to include parsed interests and transform papers
  const userWithInterests = {
    ...user,
    interests: stringToArray(user.interests),
    likedPapers: user.likedPapers.map((lp) => ({
      ...lp,
      paper: transformPaper(lp.paper),
    })),
    savedPapers: user.savedPapers.map((sp) => ({
      ...sp,
      paper: transformPaper(sp.paper),
    })),
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <UserProfile user={userWithInterests} isOwnProfile={true} />
      <DeleteAccount username={user.username} />
    </div>
  )
}
