import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MAX_POST_CHARS } from '@/lib/peer-review'
import { notifyReply } from '@/lib/notifications'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId, content } = await request.json()

    if (!commentId || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Comment ID and content are required' },
        { status: 400 }
      )
    }

    if (content.length > MAX_POST_CHARS) {
      return NextResponse.json({ error: `Replies are limited to ${MAX_POST_CHARS} characters` }, { status: 400 })
    }

    const reply = await prisma.commentReply.create({
      data: {
        commentId,
        userId: session.user.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        votes: true,
      },
    })

    // awaited so it finishes before the serverless function is frozen; errors are only logged
    await notifyReply(reply.id).catch((err) => console.error('[notifications] reply failed:', err))
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
