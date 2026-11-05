import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { isModerator } from '@/lib/forum-trust'
import { emailConfigured, sendEmail } from '@/lib/email'

// Sends a test email to the admin who asks, to prove the email settings work.
export async function POST() {
  const session = await getSafeServerSession()
  if (!session?.user?.email || !(await isModerator(session.user))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!emailConfigured()) return NextResponse.json({ error: 'Email is not configured (RESEND_API_KEY / EMAIL_FROM)' }, { status: 400 })
  const ok = await sendEmail(session.user.email, 'ResearchSwipe test email', '<p>Email is working.</p>', 'Email is working.')
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: 'The email provider refused it; check the API key and sender domain.' }, { status: 502 })
}
