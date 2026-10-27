import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkUnsubscribeToken } from '@/lib/digest'

export const dynamic = 'force-dynamic'

// One-click unsubscribe from the weekly email (signed link, no login).
export async function GET(request: Request) {
  const url = new URL(request.url)
  const u = url.searchParams.get('u') ?? ''
  const t = url.searchParams.get('t') ?? ''
  const ok = u && t && checkUnsubscribeToken(u, t)
  if (ok) await prisma.user.updateMany({ where: { id: u }, data: { emailDigest: false } })
  const msg = ok ? 'You won’t get the weekly email any more. You can turn it back on from Notifications.' : 'This unsubscribe link is not valid.'
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width"><title>ResearchSwipe</title><body style="font-family:system-ui;max-width:480px;margin:15vh auto;padding:0 16px;color:#1f2937"><p>${msg}</p><p><a href="/notifications" style="color:#1f5c5c">Go to notifications</a></p></body>`,
    { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
