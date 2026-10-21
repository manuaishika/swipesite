import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cleanTags } from '@/lib/saved-tags'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paperId, saved, tags: rawTags } = await request.json()
    const tags = cleanTags(rawTags)

    if (!paperId || typeof saved !== 'boolean' || tags === null) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    if (saved) {
      await prisma.savedPaper.upsert({
        where: {
          userId_paperId: {
            userId: session.user.id,
            paperId,
          },
        },
        // re-saving updates the tags
        update: rawTags === undefined ? {} : { tags: JSON.stringify(tags) },
        create: {
          userId: session.user.id,
          paperId,
          tags: JSON.stringify(tags),
        },
      })

      // Create activity
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          type: 'save',
          paperId,
        },
      })
    } else {
      await prisma.savedPaper.deleteMany({
        where: {
          userId: session.user.id,
          paperId,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving paper:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
