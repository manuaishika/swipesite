import { getSafeServerSession } from '@/lib/safe-session'
import { LoginGate } from '@/components/auth/LoginGate'
import { prisma } from '@/lib/prisma'
import { transformPapers } from '@/lib/paper-helpers'
import { PaperComparison } from '@/components/compare/PaperComparison'

export default async function ComparePage() {
  const session = await getSafeServerSession()

  if (!session) {
    return (
      <LoginGate
        title="Compare papers"
        body="Compare puts the papers you've saved side by side. Log in to use it."
        next="/compare"
      />
    )
  }

  // Get user's saved papers for comparison
  const savedPapers = await prisma.savedPaper.findMany({
    where: { userId: session.user.id },
    include: {
      paper: {
        include: {
          likes: {
            where: { liked: true },
          },
        },
      },
    },
    take: 50,
    orderBy: {
      createdAt: 'desc',
    },
  })

  const papers = transformPapers(savedPapers.map((sp) => sp.paper))

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">Compare Papers</h1>
        <p className="text-gray-600">
          Select two papers to get an AI-powered comparison. Understand which paper is more promising, 
          what makes it stand out, and why it might be worth your time.
        </p>
      </div>

      <PaperComparison papers={papers} userId={session.user.id} />
    </div>
  )
}
