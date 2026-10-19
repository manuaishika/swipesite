import { practiceHandler } from '@/lib/practice/http'
import { submitReview } from '@/lib/practice/service'

// [id] is the review assignment id.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  return practiceHandler(request, async (userId, b) => ({
    reviewId: await submitReview(userId, params.id, b.scores, b.comment),
  }))
}
