import { practiceHandler } from '@/lib/practice/http'
import { claimReview } from '@/lib/practice/service'

export async function POST(request: Request) {
  return practiceHandler(request, async (userId) => ({ assignmentId: await claimReview(userId) }))
}
