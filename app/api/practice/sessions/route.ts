import { practiceHandler } from '@/lib/practice/http'
import { startSession } from '@/lib/practice/service'

export async function POST(request: Request) {
  return practiceHandler(request, async (userId, b) => ({
    id: await startSession(userId, String(b.abstractId ?? ''), Number(b.minutes), b.declared === true),
  }))
}
