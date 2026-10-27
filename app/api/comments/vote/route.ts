import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId, voteType } = await request.json()

    if (!commentId || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const target = await prisma.comment.findUnique({ where: { id: commentId }, select: { userId: true } })
    if (!target) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (target.userId === session.user.id) {
      return NextResponse.json({ error: "You can't vote on your own post" }, { status: 400 })
    }

    // Check if vote exists
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: session.user.id,
        },
      },
    })

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote
        await prisma.commentVote.delete({
          where: {
            commentId_userId: {
              commentId,
              userId: session.user.id,
            },
          },
        })

        // Update comment vote counts
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            [voteType === 'upvote' ? 'upvotes' : 'downvotes']: {
              decrement: 1,
            },
          },
        })
      } else {
        // Change vote
        await prisma.commentVote.update({
          where: {
            commentId_userId: {
              commentId,
              userId: session.user.id,
            },
          },
          data: { voteType },
        })

        // Update comment vote counts
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            upvotes: {
              [voteType === 'upvote' ? 'increment' : 'decrement']: 1,
            },
            downvotes: {
              [voteType === 'downvote' ? 'increment' : 'decrement']: 1,
            },
          },
        })
      }
    } else {
      // Create new vote
      await prisma.commentVote.create({
        data: {
          commentId,
          userId: session.user.id,
          voteType,
        },
      })

      // Update comment vote counts
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          [voteType === 'upvote' ? 'upvotes' : 'downvotes']: {
            increment: 1,
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error voting on comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
