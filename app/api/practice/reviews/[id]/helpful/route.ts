import { practiceHandler } from '@/lib/practice/http'
import { markHelpful } from '@/lib/practice/service'

// [id] is the review id; only the submission's author may call this.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  return practiceHandler(request, async (userId, b) => {
    await markHelpful(userId, params.id, b.helpful === true)
    return { ok: true }
  })
}
