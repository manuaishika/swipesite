import { NextResponse } from 'next/server'
import { getSafeServerSession } from '@/lib/safe-session'
import { prisma } from '@/lib/prisma'

// { confirm: "<your username>" } — deletes the account and everything attached to it.
export async function POST(request: Request) {
  const session = await getSafeServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } })
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  const { confirm } = await request.json().catch(() => ({}))
  if (confirm !== user.username) return NextResponse.json({ error: 'Type your username to confirm' }, { status: 400 })

  // Votes aren't linked to users in the schema, so take them back out of the counts first.
  const [votes, replyVotes] = await Promise.all([
    prisma.commentVote.findMany({ where: { userId }, select: { commentId: true, voteType: true } }),
    prisma.commentReplyVote.findMany({ where: { userId }, select: { replyId: true, voteType: true } }),
  ])
  await prisma.$transaction([
    ...votes.map((v) =>
      prisma.comment.updateMany({ where: { id: v.commentId }, data: v.voteType === 'upvote' ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } } }),
    ),
    ...replyVotes.map((v) =>
      prisma.commentReply.updateMany({ where: { id: v.replyId }, data: v.voteType === 'upvote' ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } } }),
    ),
    prisma.commentVote.deleteMany({ where: { userId } }),
    prisma.commentReplyVote.deleteMany({ where: { userId } }),
    prisma.appEvent.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }), // posts, saves, ratings, practice work etc. cascade
  ])
  return NextResponse.json({ ok: true })
}
