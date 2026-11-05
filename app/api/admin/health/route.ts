import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { isModerator } from '@/lib/forum-trust'
import { runChecks } from '@/lib/health'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const session = await getSafeServerSession()
  if (!(await isModerator(session?.user).catch(() => false))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ checks: await runChecks(), at: new Date().toISOString() })
}
