import { practiceHandler } from '@/lib/practice/http'
import { submitAnswers } from '@/lib/practice/service'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  return practiceHandler(request, async (userId, b) => ({
    submissionId: await submitAnswers(userId, params.id, b.answers),
  }))
}
