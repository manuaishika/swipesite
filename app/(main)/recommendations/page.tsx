import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LoginGate } from '@/components/auth/LoginGate'
import { prisma } from '@/lib/prisma'
import { generateRecommendations, saveRecommendations } from '@/lib/recommendations'
import { RecommendationsList } from '@/components/recommendations/RecommendationsList'
import { transformPapers } from '@/lib/paper-helpers'

export default async function RecommendationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <LoginGate
        title="Recommendations for you"
        body="Recommendations are built from the papers you pick. Log in to see yours."
        next="/recommendations"
      />
    )
  }

  // Generate fresh recommendations
  const recommendations = await generateRecommendations(session.user.id, 20)

  // Save recommendations to database
  await saveRecommendations(session.user.id, recommendations)

  // Get full paper data for recommendations
  const paperIds = recommendations.map((r) => r.paperId)
  const papers = await prisma.paper.findMany({
    where: {
      id: { in: paperIds },
    },
    include: {
      likes: {
        where: { liked: true },
      },
    },
  })

  // Combine papers with their recommendation scores
  const papersWithScores = papers.map((paper) => {
    const rec = recommendations.find((r) => r.paperId === paper.id)
    return {
      ...paper,
      recommendationScore: rec?.score || 0,
      recommendationReason: rec?.reason || '',
    }
  }).sort((a, b) => b.recommendationScore - a.recommendationScore)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recommended Papers</h1>
        <p className="text-gray-600">
          Personalized recommendations based on your interests and activity
        </p>
      </div>
      <RecommendationsList papers={transformPapers(papersWithScores)} userId={session.user.id} />
    </div>
  )
}
