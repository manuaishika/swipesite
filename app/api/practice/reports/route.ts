import { practiceHandler } from '@/lib/practice/http'
import { fileReport } from '@/lib/practice/service'

export async function POST(request: Request) {
  return practiceHandler(request, async (userId, b) => {
    await fileReport(userId, b.type, b.targetId, b.reason)
    return { ok: true }
  })
}
