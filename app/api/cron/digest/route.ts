import { NextResponse } from 'next/server'
import { sendDigests } from '@/lib/digest'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

// Weekly (see vercel.json). Requires CRON_SECRET when set; without it only Vercel's own header is trusted.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const fromVercel = request.headers.get('user-agent')?.startsWith('vercel-cron')
  if (secret ? auth !== `Bearer ${secret}` : !fromVercel) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await sendDigests())
  } catch (err) {
    console.error('digest cron failed:', err)
    return NextResponse.json({ error: 'Digest failed' }, { status: 500 })
  }
}
