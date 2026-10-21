import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  Bookmark,
  Calendar,
  Compass,
  GitCompare,
  Layers,
  Lightbulb,
  Mail,
  MessagesSquare,
  PenLine,
  Sparkles,
  Users,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { ActivityFeed } from '@/components/feed/ActivityFeed'
import { getNiche } from '@/lib/niche'
import { NICHE_READY_AFTER, type Niche } from '@/lib/niche-core'
import { kindMeta, plural } from '@/lib/peer-review'

export const dynamic = 'force-dynamic'

const SECONDARY = [
  { href: '/collection', label: 'Collection', body: 'Papers you saved', icon: Bookmark },
  { href: '/practice', label: 'Practice critiques', body: 'Timed, peer-scored abstract critiques', icon: PenLine },
  { href: '/recommendations', label: 'Recommendations', body: 'More papers like your picks', icon: Sparkles },
  { href: '/compare', label: 'Compare', body: 'Put papers side by side', icon: GitCompare },
  { href: '/collaborations', label: 'Collaborate', body: 'Find research partners', icon: Users },
  { href: '/conferences', label: 'Conferences', body: 'Upcoming venues and deadlines', icon: Calendar },
  { href: '/opportunities', label: 'Opportunities', body: 'Reach out to researchers', icon: Mail },
  { href: '/critique', label: 'Idea critique', body: 'Feedback on a research idea', icon: Lightbulb },
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Logged-out visitors get the landing page, which explains the app and lets them start swiping.
  if (!session) {
    redirect('/')
  }
  const userId = session.user.id

  let niche: Niche | null = null
  let toSwipe = 0
  let waiting: { id: string; title: string }[] = []
  let waitingCount = 0
  let threadActivity: any[] = []
  let activities: any[] = []
  let dbError: string | null = null

  try {
    const sinceTwoWeeks = new Date(Date.now() - 14 * 24 * 3600 * 1000)
    const [n, swipeCount, picks, pickCount, mine, acts] = await Promise.all([
      getNiche(userId),
      prisma.paper.count({ where: { likes: { none: { userId } } } }),
      prisma.paperLike.findMany({
        where: { userId, liked: true, paper: { comments: { none: { userId, kind: 'review' } } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { paper: { select: { id: true, title: true } } },
      }),
      prisma.paperLike.count({ where: { userId, liked: true, paper: { comments: { none: { userId, kind: 'review' } } } } }),
      prisma.comment.findMany({ where: { userId }, distinct: ['paperId'], select: { paperId: true }, take: 200 }),
      prisma.activity.findMany({
        // skips are logged too, but they're noise here (the feed renders them as "performed an action")
        where: { userId, type: { in: ['like', 'comment', 'save', 'collaboration', 'follow'] } },
        include: {
          user: { select: { id: true, name: true, username: true, avatar: true } },
          paper: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ])
    niche = n
    toSwipe = swipeCount
    waiting = picks.map((p) => p.paper)
    waitingCount = pickCount
    activities = acts
    // New posts by others in threads you've posted in.
    threadActivity = await prisma.comment.findMany({
      where: { paperId: { in: mine.map((m) => m.paperId) }, userId: { not: userId }, createdAt: { gt: sinceTwoWeeks } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        id: true,
        kind: true,
        content: true,
        createdAt: true,
        user: { select: { name: true, username: true } },
        paper: { select: { id: true, title: true } },
      },
    })
  } catch (error: any) {
    console.error('Database error in dashboard:', error)
    dbError = error.message || 'Database connection failed'
  }

  if (dbError || !niche) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            Database Connection Error
          </h2>
          <p className="text-red-700 mb-4">
            {dbError?.includes('SQLite') || dbError?.includes('file:')
              ? "SQLite doesn't work on Vercel. You need to use PostgreSQL. Check /api/status for details."
              : dbError}
          </p>
          <Link
            href="/api/status"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Check Status →
          </Link>
        </div>
      </div>
    )
  }

  const name = session.user.name || session.user.username

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Hi {name}</h1>
      <p className="mt-1 text-gray-600">Find your niche by swiping abstracts, then review what you picked with other researchers.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* pillar 1: find your niche */}
        <section className="flex flex-col rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <Compass className="h-4 w-4" /> Find your niche
          </div>
          {niche.ready ? (
            <>
              <h2 className="mt-3 text-2xl font-bold leading-tight">You lean towards {niche.areas[0].label}</h2>
              <ul className="mt-5 space-y-3">
                {niche.areas.slice(0, 3).map((a) => (
                  <li key={a.label}>
                    <div className="flex justify-between text-sm">
                      <span>{a.label}</span>
                      <span className="tabular-nums text-white/70">{Math.round(a.share * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(4, a.share * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h2 className="mt-3 text-2xl font-bold leading-tight">
                {niche.swipes === 0 ? 'Start swiping to find your niche' : 'Your niche is taking shape'}
              </h2>
              <p className="mt-2 text-white/80">
                {niche.swipesToReady > 0
                  ? `Swipe ${niche.swipesToReady} more abstract${niche.swipesToReady === 1 ? '' : 's'} to reveal it.`
                  : 'Swipe right on a few more papers you would want to work on.'}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(1, niche.swipes / NICHE_READY_AFTER) * 100}%` }} />
              </div>
            </>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            <Link href="/swipe" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary-50">
              <Layers className="h-4 w-4" /> {niche.swipes === 0 ? 'Start swiping' : 'Continue swiping'}
            </Link>
            <span className="text-sm text-white/70">{plural(toSwipe, 'abstract')} waiting</span>
            {niche.swipes > 0 && (
              <Link href="/niche" className="ml-auto text-sm font-semibold text-white/90 hover:text-white">
                My niche →
              </Link>
            )}
          </div>
        </section>

        {/* pillar 2: peer review */}
        <section className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <MessagesSquare className="h-4 w-4" /> Peer review
          </div>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-gray-900">
            {waitingCount > 0 ? `${plural(waitingCount, 'pick')} waiting for your review` : 'Review what you picked'}
          </h2>
          {waiting.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {waiting.map((p) => (
                <li key={p.id}>
                  <Link href={`/paper/${p.id}#discussion`} className="flex items-center justify-between gap-3 rounded-xl bg-primary-50/60 px-4 py-2.5 text-sm hover:bg-primary-50">
                    <span className="line-clamp-1 font-medium text-gray-900">{p.title}</span>
                    <span className="shrink-0 font-semibold text-primary">Review</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-gray-600">Swipe right on papers you&apos;d want to work on, then come here to review them.</p>
          )}
          {threadActivity.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">New in your threads</p>
              <ul className="mt-2 space-y-2">
                {threadActivity.map((c) => (
                  <li key={c.id} className="text-sm">
                    <Link href={`/paper/${c.paper.id}#discussion`} className="block rounded-lg px-1 py-0.5 hover:bg-gray-50">
                      <span className="font-medium text-gray-900">{c.user.name || c.user.username}</span>{' '}
                      <span className="text-gray-500">
                        posted a {kindMeta(c.kind).label.toLowerCase()} on
                      </span>{' '}
                      <span className="font-medium text-gray-800">{c.paper.title}</span>{' '}
                      <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-auto pt-6">
            <Link href="/discussions" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-light">
              Open peer review <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>

      {/* everything else */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">Also on ResearchSwipe</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {SECONDARY.map((s) => (
            <Link key={s.href} href={s.href} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary">
              <s.icon className="h-5 w-5 text-primary" />
              <div className="mt-2 text-sm font-semibold text-gray-900">{s.label}</div>
              <div className="mt-0.5 text-xs text-gray-500">{s.body}</div>
            </Link>
          ))}
        </div>
      </section>

      {activities.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent activity</h2>
          <ActivityFeed activities={activities} />
        </section>
      )}
    </div>
  )
}
