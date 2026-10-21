import { redirect } from 'next/navigation'
import { getSafeServerSession } from '@/lib/safe-session'
import Link from 'next/link'
import { SwipeDemo } from '@/components/landing/SwipeDemo'
import { Navbar } from '@/components/layout/Navbar'
import {
  ArrowRight,
  Bookmark,
  Calendar,
  Compass,
  Layers,
  Mail,
  MessagesSquare,
  PenLine,
  Sparkles,
  ThumbsUp,
  Users,
} from 'lucide-react'

const SECONDARY = [
  { icon: Bookmark, title: 'Collection', body: 'Keep the papers you picked' },
  { icon: PenLine, title: 'Practice critiques', body: 'Timed abstract critiques, peer-scored' },
  { icon: Sparkles, title: 'Recommendations', body: 'More papers like your picks' },
  { icon: Users, title: 'Collaborate', body: 'Find research partners' },
  { icon: Calendar, title: 'Conferences', body: 'Venues and deadlines', href: '/conferences' },
  { icon: Mail, title: 'Opportunities', body: 'Reach out to researchers', href: '/opportunities' },
]

const STEPS = [
  { icon: Layers, title: 'Swipe abstracts', body: 'Right if you would want to work on it, left if not.' },
  { icon: Compass, title: 'See your niche', body: 'The areas you keep choosing add up to your niche.' },
  { icon: MessagesSquare, title: 'Review your picks', body: 'Write a review, ask questions, see where others land.' },
]

export default async function Home() {
  const session = await getSafeServerSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {/* hero */}
        <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="text-center lg:text-left">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary-dark">
              Real abstracts from arXiv
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-primary-dark sm:text-6xl">
              Swipe abstracts.
              <br />
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">Find your niche.</span>
              <br />
              Argue about it.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-600 lg:mx-0">
              Swipe right on research you&apos;d want to work on, left on what you wouldn&apos;t. Your swipes add up to
              your niche. Then review the papers you picked with other researchers.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                href="/swipe"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-lg font-bold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:bg-primary-light"
              >
                Start swiping free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border-2 border-primary bg-white px-7 py-3.5 text-lg font-bold text-primary transition hover:bg-primary-50"
              >
                Log in
              </Link>
            </div>
            <p className="mt-3 text-sm text-gray-500">No sign-up needed to start. Save your niche whenever you like.</p>
          </div>
          <SwipeDemo />
        </section>

        {/* how it works */}
        <ol className="mt-16 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm text-white">{i + 1}</span>
                <s.icon className="h-4 w-4 text-primary" /> {s.title}
              </div>
              <p className="mt-2 text-sm text-gray-600">{s.body}</p>
            </li>
          ))}
        </ol>

        {/* pillar 2 */}
        <section className="mt-20 grid items-center gap-10 md:grid-cols-2">
          <div className="md:order-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-primary">Peer review</span>
            <h2 className="mt-2 text-3xl font-bold text-primary-dark sm:text-4xl">You picked it. Now argue about it.</h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Every paper has a review thread. Write a structured review with a verdict, ask a question, or start a
              discussion. Vote on the posts that help, and see at a glance whether reviewers find a paper promising,
              mixed or unconvinced.
            </p>
          </div>
          <div className="space-y-3 rounded-3xl bg-gradient-to-br from-primary/10 to-accent-light/10 p-6 sm:p-8 md:order-1">
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">M</span>
                <span className="font-semibold text-gray-900">maya</span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">Review</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Promising</span>
              </div>
              <p className="mt-2 text-sm text-gray-700">
                <strong>Main claim:</strong> attention alone matches recurrent models on translation.{' '}
                <strong>What&apos;s missing:</strong> how it scales to long documents.
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <ThumbsUp className="h-3.5 w-3.5" /> 12
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">J</span>
                <span className="font-semibold text-gray-900">jon</span>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">Question</span>
              </div>
              <p className="mt-2 text-sm text-gray-700">Would the result hold without the large training budget?</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <p className="text-sm font-semibold text-gray-900">Reviewers&apos; verdict</p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full">
                <span className="bg-emerald-500" style={{ width: '60%' }} />
                <span className="bg-amber-400" style={{ width: '25%' }} />
                <span className="bg-rose-500" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* secondary */}
        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold text-primary-dark">Also on ResearchSwipe</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
            {SECONDARY.map((f) => (
              <Link
                key={f.title}
                href={f.href ?? '/register'}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-primary"
              >
                <f.icon className="h-5 w-5 text-primary" />
                <div className="mt-2 font-semibold text-gray-900">{f.title}</div>
                <div className="mt-0.5 text-sm text-gray-500">{f.body}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* final CTA */}
        <section className="mt-20 rounded-3xl bg-gradient-to-r from-primary to-primary-light p-10 text-center text-white shadow-xl sm:p-12">
          <h2 className="text-3xl font-bold sm:text-4xl">Ten swipes to your niche</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            It takes about ten abstracts for your niche to show, and you don&apos;t need an account to start.
          </p>
          <Link
            href="/swipe"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-lg font-bold text-primary shadow-lg transition hover:bg-gray-100"
          >
            Start swiping <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </div>
    </div>
  )
}
