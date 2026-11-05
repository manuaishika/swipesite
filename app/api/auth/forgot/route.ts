import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { emailConfigured, sendEmail } from '@/lib/email'
import { siteUrl } from '@/lib/digest'
import { createResetToken } from '@/lib/password-reset'

/**
 * { email } -> emails a one-time reset link if an account exists. The answer is the same either way,
 * so the form can't be used to find out who has an account. When email isn't set up on this site,
 * it says so instead of pretending.
 */
export async function POST(request: Request) {
  if (!emailConfigured()) return NextResponse.json({ ok: false, emailOff: true })
  const { email } = await request.json().catch(() => ({}))
  if (typeof email !== 'string' || !email.includes('@') || email.length > 200) return NextResponse.json({ error: 'Enter your email address' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } }).catch(() => null)
    ?? (await prisma.user.findUnique({ where: { email: email.trim() } }).catch(() => null))
  if (user) {
    const token = await createResetToken(user.id)
    if (token) {
      const link = `${siteUrl()}/reset-password?token=${token}`
      await sendEmail(
        user.email,
        'Reset your ResearchSwipe password',
        `<p>Someone asked to reset the password for your ResearchSwipe account.</p><p><a href="${link}">Choose a new password</a> (the link works once, for one hour).</p><p>If it wasn't you, ignore this email; your password stays the same.</p>`,
        `Choose a new password (works once, for one hour): ${link}\n\nIf it wasn't you, ignore this email.`,
      )
    }
  }
  return NextResponse.json({ ok: true })
}
