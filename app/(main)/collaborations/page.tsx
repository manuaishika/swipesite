import { getSafeServerSession } from '@/lib/safe-session'
import Link from 'next/link'
import { loginHref } from '@/lib/login-href'
import { prisma } from '@/lib/prisma'
import { CollaborationsList } from '@/components/collaboration/CollaborationsList'
import { safeLoad } from '@/lib/safe-load'
import { DbUnavailable } from '@/components/DbUnavailable'
import { DemoPlayer } from '@/components/auth/DemoPlayer'

export const dynamic = 'force-dynamic'

export default async function CollaborationsPage() {
  // Public: anyone can browse collaborations; requesting or posting needs an account.
  const session = await getSafeServerSession()
  const userId = session?.user?.id ?? null

  const collaborations = await safeLoad('collaborations', () =>
    prisma.collaboration.findMany({
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
    }),
  )
  if (!collaborations) return <DbUnavailable />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Collaborations</h1>
        <Link
          href={userId ? '/collaborations/new' : loginHref('/collaborations/new')}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          Post Collaboration
        </Link>
      </div>
      {!userId && <DemoPlayer demo="collab" className="mb-6 max-w-xl" />}
      <CollaborationsList collaborations={collaborations} userId={userId} />
    </div>
  )
}
