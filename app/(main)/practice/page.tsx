import Link from 'next/link'
import { ArrowRight, BookOpen, ClipboardCheck, Clock, FileText, Inbox, Lock, MessagesSquare, PenLine, Play, Users } from 'lucide-react'
import { requireUserId } from '@/lib/practice/require-user'
import { getDashboard, listLibrary } from '@/lib/practice/service'
import { ArxivAttribution, Rules } from '@/components/practice/Notices'
import { Card, Chip, EmptyState, PageShell, SectionTitle } from '@/components/practice/ui'

export const dynamic = 'force-dynamic'

const STEPS = [
  { icon: BookOpen, title: 'Read', body: 'Pick an AI safety abstract. Title only until you start.' },
  { icon: PenLine, title: 'Write', body: 'Answer 7 fixed prompts against a timer. No AI.' },
  { icon: Users, title: 'Review', body: 'Unlock the queue and score a peer, anonymously.' },
  { icon: MessagesSquare, title: 'Learn', body: 'Get scores and a comment from two reviewers.' },
]

export default async function PracticeHome() {
  const userId = await requireUserId()
  const [library, dash] = await Promise.all([listLibrary(), getDashboard(userId)])
  const pending = dash.queue.filter((q) => !q.completed)
  const reviewsGiven = dash.queue.length - pending.length
  const reviewsReceived = dash.submissions.reduce((n, s) => n + s.reviewsDone, 0)

  return (
    <PageShell wide>
      {/* hero */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg sm:p-10">
        <div className="max-w-2xl">
          <Chip tone="teal">Peer-review practice</Chip>
          <h1 className="mt-4 text-2xl font-bold leading-tight sm:text-4xl">
            Get better at reasoning from an abstract alone.
          </h1>
          <p className="mt-3 text-base text-white/80 sm:text-lg">
            Say what&apos;s claimed, what supports it, and what&apos;s missing, against the clock. Then see how two peers scored you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#library" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary-50">
              <Play className="h-4 w-4" /> Start practising
            </a>
            {dash.unlocked ? (
              <Link href="/practice/reviews" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                <ClipboardCheck className="h-4 w-4" /> Review queue
                {pending.length > 0 && <span className="rounded-full bg-white px-2 text-xs font-bold text-primary">{pending.length}</span>}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white/60" title="Submit your own answers first">
                <Lock className="h-4 w-4" /> Review queue (locked)
              </span>
            )}
          </div>
        </div>
        <ol className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">{i + 1}</span>
                <s.icon className="h-4 w-4" /> {s.title}
              </div>
              <p className="mt-1.5 hidden text-sm text-white/75 sm:block">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6">
        <Rules />
      </div>

      {dash.inProgress.length > 0 && (
        <section className="mt-6 space-y-2">
          {dash.inProgress.map((s) => (
            <Link
              key={s.id}
              href={`/practice/session/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-50 px-5 py-4 transition hover:border-primary"
            >
              <span className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-primary">Session in progress</span>
                  <span className="font-medium text-gray-900">{s.title}</span>
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Resume <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* library */}
        <section id="library" className="scroll-mt-6">
          <SectionTitle hint={`${library.length} abstracts`}>Abstract library</SectionTitle>
          {library.length === 0 ? (
            <EmptyState icon={<Inbox className="h-5 w-5" />} title="No practice abstracts yet">
              Run <code className="rounded bg-gray-100 px-1">npm run seed:practice</code> to load them from arXiv (see PRACTICE.md).
            </EmptyState>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {library.map((a) => (
                <Link
                  key={a.id}
                  href={`/practice/start/${a.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip>arXiv:{a.arxivId}</Chip>
                      {a.year && <Chip>{a.year}</Chip>}
                    </div>
                    <h3 className="mt-3 line-clamp-3 font-semibold leading-snug text-gray-900">{a.title}</h3>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Practise <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4">
            <ArxivAttribution />
          </div>
        </section>

        {/* activity */}
        <aside className="space-y-6">
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              { label: 'Submitted', value: dash.submissions.length },
              { label: 'Reviews given', value: reviewsGiven },
              { label: 'Reviews received', value: reviewsReceived },
            ].map((s) => (
              <Card key={s.label} className="px-4 py-3 text-center lg:text-left xl:text-center">
                <div className="text-2xl font-bold tabular-nums text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </Card>
            ))}
          </div>

          <div>
            <SectionTitle>Reviews to do</SectionTitle>
            {!dash.unlocked ? (
              <Card className="flex items-start gap-3 p-4 text-sm text-gray-600">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                Submit your own answers first. Reviewing others unlocks after that.
              </Card>
            ) : pending.length === 0 ? (
              <Card className="p-4 text-sm text-gray-600">
                Nothing pending.{' '}
                <Link className="font-medium text-primary underline-offset-2 hover:underline" href="/practice/reviews">
                  Get one to review
                </Link>
                .
              </Card>
            ) : (
              <div className="space-y-2">
                {pending.map((q) => (
                  <Link key={q.id} href={`/practice/reviews/${q.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-primary">
                    <span className="line-clamp-2 font-medium text-gray-900">{q.title}</span>
                    <span className="shrink-0 font-semibold text-primary">Review</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionTitle>My submissions</SectionTitle>
            {dash.submissions.length === 0 ? (
              <Card className="flex items-start gap-3 p-4 text-sm text-gray-600">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                None yet. Pick an abstract to get started.
              </Card>
            ) : (
              <div className="space-y-2">
                {dash.submissions.map((s) => (
                  <Link key={s.id} href={`/practice/feedback/${s.id}`} className="block rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-primary">
                    <span className="line-clamp-2 text-sm font-medium text-gray-900">{s.title}</span>
                    <span className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <span className="flex gap-1">
                        {[0, 1].map((i) => (
                          <span key={i} className={`h-1.5 w-6 rounded-full ${i < s.reviewsDone ? 'bg-primary' : 'bg-gray-200'}`} />
                        ))}
                      </span>
                      {s.reviewsDone}/2 reviews
                      {s.status === 'hidden' && <Chip tone="amber">hidden</Chip>}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
