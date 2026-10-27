import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyThreadPost } from '@/lib/notifications'
import { isPostKind, isVerdict, MAX_POST_CHARS } from '@/lib/peer-review'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paperId, content, kind = 'discussion', verdict = null } = await request.json()

    if (!paperId || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'Paper ID and content are required' },
        { status: 400 }
      )
    }
    if (content.length > MAX_POST_CHARS) {
      return NextResponse.json({ error: `Posts are limited to ${MAX_POST_CHARS} characters` }, { status: 400 })
    }
    if (!isPostKind(kind)) {
      return NextResponse.json({ error: 'Unknown post type' }, { status: 400 })
    }
    if (kind === 'review' && !isVerdict(verdict)) {
      return NextResponse.json({ error: 'A review needs a verdict' }, { status: 400 })
    }

    const comment = await prisma.comment.create({
      data: {
        userId: session.user.id,
        paperId,
        content: content.trim(),
        kind,
        verdict: kind === 'review' ? verdict : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: { user: { select: { id: true, name: true, username: true } }, votes: true },
        },
        votes: true,
      },
    })

    await notifyThreadPost(comment.id).catch((err) => console.error('[notifications] thread post failed:', err))
    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
