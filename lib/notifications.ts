import { prisma } from '@/lib/prisma'

const snippet = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)
const who = (u: { name: string | null; username: string } | null) => u?.name || u?.username || 'Someone'

/** Someone replied to a post: tell the post's author (not themselves). */
export async function notifyReply(replyId: string) {
  const reply = await prisma.commentReply.findUnique({
    where: { id: replyId },
    include: {
      user: { select: { name: true, username: true } },
      comment: { select: { id: true, userId: true, paperId: true, paper: { select: { title: true } } } },
    },
  })
  if (!reply || reply.comment.userId === reply.userId) return
  await prisma.notification.create({
    data: {
      userId: reply.comment.userId,
      actorId: reply.userId,
      kind: 'reply',
      title: `${who(reply.user)} replied to your post on “${snippet(reply.comment.paper.title, 80)}”`,
      body: snippet(reply.content),
      href: `/paper/${reply.comment.paperId}#c-${reply.comment.id}`,
    },
  })
}

/** A new post in a thread: tell up to 25 earlier participants (not the poster). */
export async function notifyThreadPost(commentId: string) {
  const c = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { user: { select: { name: true, username: true } }, paper: { select: { title: true } } },
  })
  if (!c) return
  const [posters, repliers] = await Promise.all([
    prisma.comment.findMany({ where: { paperId: c.paperId, id: { not: c.id } }, select: { userId: true }, distinct: ['userId'], take: 50 }),
    prisma.commentReply.findMany({ where: { comment: { paperId: c.paperId } }, select: { userId: true }, distinct: ['userId'], take: 50 }),
  ])
  const ids = Array.from(new Set([...posters, ...repliers].map((x) => x.userId))).filter((id) => id !== c.userId).slice(0, 25)
  if (!ids.length) return
  await prisma.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      actorId: c.userId,
      kind: 'thread_post',
      title: `${who(c.user)} posted in “${snippet(c.paper.title, 80)}”`,
      body: snippet(c.content),
      href: `/paper/${c.paperId}#c-${c.id}`,
    })),
  })
}
