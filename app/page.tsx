import { redirect } from 'next/navigation'
import { getSafeServerSession } from '@/lib/safe-session'
import { SwipeDemo, type DemoCard } from '@/components/landing/SwipeDemo'
import { Navbar } from '@/components/layout/Navbar'
import { ActiveDiscussions } from '@/components/discussion/ActiveDiscussions'
import { PhysicsCard, PhysicsLink, Stagger, StaggerItem } from '@/components/motion/Physics'
import { prisma } from '@/lib/prisma'
import { stringToArray } from '@/lib/json-helpers'
import { ArrowRight, Bookmark, Calendar, Mail, PenLine, Sparkles, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SECONDARY = [
  { icon: Bookmark, title: 'Collection', body: 'Papers you saved, with your tags' },
  { icon: PenLine, title: 'Practice critiques', body: 'Timed abstract critiques, peer-scored' },
  { icon: Sparkles, title: 'Recommendations', body: 'More papers like the ones you pick' },
  { icon: Users, title: 'Collaborate', body: 'Find people to work with' },
  { icon: Calendar, title: 'Conferences', body: 'Upcoming venues and deadlines', href: '/conferences' },
  { icon: Mail, title: 'Opportunities', body: 'Open positions and calls', href: '/opportunities' },
]

const STEPS = [
  { title: 'Rate abstracts', body: 'Swipe right on work you’d want to do, left on what you wouldn’t. Save anything for later.' },
  { title: 'See your patterns', body: 'Your ratings are grouped by arXiv category, so you can see which areas you keep choosing.' },
  { title: 'Discuss what you pick', body: 'Ask questions, follow up, and share short reviews with people reading the same papers.' },
]

/** A few real papers from the database for the demo (falls back to built-in examples). */
async function demoCards(): Promise<DemoCard[] | null> {
  try {
    const rows = await prisma.paper.findMany({
      where: { categories: { not: '[]' }, abstract: { not: '' } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { title: true, abstract: true, categories: true, keywords: true, publishedDate: true },
    })
    if (rows.length < 3) return null
    return rows.map((r, i) => ({
      title: r.title,
      abstract: r.abstract,
      category: stringToArray(r.categories)[0] ?? '',
      keywords: stringToArray(r.keywords),
      year: r.publishedDate ? new Date(r.publishedDate).getFullYear() : null,
      like: [true, false, true, true, false, true][i % 6],
    }))
  } catch {
    return null
  }
}

export default async function Home() {
  const session = await getSafeServerSession()

  if (session) {
    redirect('/dashboard')
  }

  const cards = await demoCards()

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        {/* hero */}
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-primary-dark sm:text-5xl">
              Find the research you actually want to work on.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg lg:mx-0">
              Read real arXiv abstracts one at a time and decide: would you work on this? Your answers, grouped by
              arXiv category, show where your interest really is. Then talk the papers through with other researchers.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <PhysicsLink
                href="/swipe"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-light sm:w-auto"
              >
                Start rating abstracts <ArrowRight className="h-4 w-4" />
              </PhysicsLink>
              <PhysicsLink
                href="/discussions"
                className="inline-flex w-full items-center justify-center rounded-xl border border-primary/40 bg-white px-6 py-3 text-base font-medium text-primary hover:bg-primary-50 sm:w-auto"
              >
                Browse discussions
              </PhysicsLink>
            </div>
          </div>
          <SwipeDemo cards={cards} />
        </section>

        {/* how it works */}
        <section className="mt-14 sm:mt-20">
          <h2 className="text-center text-xl font-semibold text-gray-900 sm:text-2xl">How it works</h2>
          <Stagger as="ol" className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {STEPS.map((s, i) => (
              <StaggerItem as="li" key={s.title}>
                <PhysicsCard className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 font-medium text-gray-900">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                      {i + 1}
                    </span>
                    {s.title}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
                </PhysicsCard>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* discussion */}
        <section className="mt-14 sm:mt-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-primary-dark sm:text-3xl">A discussion on every paper</h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Ask what a result means, follow up on someone else&apos;s reading, or post a short review of what the paper
              claims and how well it supports it. Pick one below to join.
            </p>
          </div>
          <div className="mt-6">
            <ActiveDiscussions limit={3} title="Active now" />
          </div>
        </section>

        {/* secondary */}
        <section className="mt-14 sm:mt-20">
          <h2 className="text-center text-xl font-semibold text-gray-900 sm:text-2xl">Also on ResearchSwipe</h2>
          <Stagger className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3" gap={0.07}>
            {SECONDARY.map((f) => (
              <StaggerItem key={f.title}>
                <PhysicsCard href={f.href ?? '/register'} className="h-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm" tilt={12}>
                  <f.icon className="h-5 w-5 text-primary" />
                  <div className="mt-2 text-sm font-medium text-gray-900 sm:text-base">{f.title}</div>
                  <div className="mt-0.5 text-xs text-gray-500 sm:text-sm">{f.body}</div>
                </PhysicsCard>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* final CTA */}
        <section className="mt-14 rounded-3xl bg-primary p-8 text-center text-white sm:mt-20 sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Start with a few abstracts</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/85 sm:text-base">
            Read a few, decide on each, and see where your interest goes.
          </p>
          <PhysicsLink
            href="/swipe"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-medium text-primary hover:bg-gray-100"
          >
            Start rating <ArrowRight className="h-4 w-4" />
          </PhysicsLink>
        </section>
      </div>
    </div>
  )
}
