import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PracticeError } from './errors'

// Wraps a practice API handler: requires a signed-in user, parses JSON, maps PracticeError to a response.
export async function practiceHandler(
  request: Request,
  fn: (userId: string, body: any) => Promise<unknown>
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    return NextResponse.json(await fn(session.user.id, body))
  } catch (e) {
    if (e instanceof PracticeError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('practice api error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
