import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { loginHref } from '@/lib/login-href'
import { prisma } from '@/lib/prisma'
import { CollaborationsList } from '@/components/collaboration/CollaborationsList'

export default async function CollaborationsPage() {
  // Public: anyone can browse collaborations; requesting or posting needs an account.
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null

  const collaborations = await prisma.collaboration.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      },
      // Only who has requested (to show "Request sent"): request messages stay private.
      requests: {
        select: {
          userId: true,
        },
      },
      _count: {
        select: {
          requests: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Collaborations</h1>
        <Link
          href={userId ? '/collaborations/new' : loginHref('/collaborations/new')}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          Post Collaboration
        </Link>
      </div>
      <CollaborationsList collaborations={collaborations} userId={userId} />
    </div>
  )
}
