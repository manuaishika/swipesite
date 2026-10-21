import { getSafeServerSession } from '@/lib/safe-session'
import { LoginGate } from '@/components/auth/LoginGate'
import { ResearchCritique } from '@/components/critique/ResearchCritique'

export default async function CritiquePage() {
  const session = await getSafeServerSession()

  if (!session) {
    return (
      <LoginGate
        title="Idea critique"
        body="Get feedback on a research idea. Log in to use it."
        next="/critique"
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Research Idea Critique</h1>
        <p className="text-gray-600">
          Get AI-powered feedback on your research ideas before you spend months working on them. 
          Understand if your idea is incremental or foundational, identify potential issues, 
          and get suggestions for improvement.
        </p>
      </div>

      <ResearchCritique userId={session.user.id} />
    </div>
  )
}
