import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const NAMES = new Set(['page_view', 'client_error'])
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : undefined)

// Receives page views and browser errors from components/Telemetry.tsx.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const name = clip(body?.name, 40)
  if (!name || !NAMES.has(name)) return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  const session = await getSafeServerSession()
  const props: Record<string, string> = {}
  if (body?.props && typeof body.props === 'object') {
    for (const [k, v] of Object.entries(body.props).slice(0, 8)) {
      const s = clip(v, 2000)
      if (s) props[k.slice(0, 40)] = s
    }
  }
  if (name === 'client_error') console.error('[client_error]', clip(body?.path, 300), props.message, props.digest ?? '')
  try {
    await prisma.appEvent.create({
      data: {
        name,
        userId: session?.user?.id ?? null,
        anonId: clip(body?.anonId, 64) ?? null,
        path: clip(body?.path, 300) ?? null,
        props: JSON.stringify(props),
      },
    })
  } catch (err) {
    console.error('[telemetry] store failed:', err)
  }
  return NextResponse.json({ ok: true })
}
