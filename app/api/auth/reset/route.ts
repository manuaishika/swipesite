import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { validToken } from '@/lib/password-reset'

// { token, password } -> sets the new password and uses up the link (and any other open links).
export async function POST(request: Request) {
  const { token, password } = await request.json().catch(() => ({}))
  if (typeof password !== 'string' || password.length < 6 || password.length > 200) return NextResponse.json({ error: 'Use at least 6 characters' }, { status: 400 })
  const row = typeof token === 'string' ? await validToken(token) : null
  if (!row) return NextResponse.json({ error: 'This link has expired or was already used. Ask for a new one.' }, { status: 400 })
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { password: await bcrypt.hash(password, 10) } }),
    prisma.passwordReset.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ])
  return NextResponse.json({ ok: true })
}
