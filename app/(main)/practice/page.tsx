import Link from 'next/link'
import { requireUserId } from '@/lib/practice/require-user'
import { getDashboard, listLibrary } from '@/lib/practice/service'
import { ArxivAttribution, AssessmentNotice, NoAiNotice } from '@/components/practice/Notices'

export const dynamic = 'force-dynamic'

const card = 'bg-white border rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 mb-2'
const btn = 'px-3 py-1.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary-50'

export default async function PracticeHome() {
  const userId = await requireUserId()
  const [library, dash] = await Promise.all([listLibrary(), getDashboard(userId)])
  const pending = dash.queue.filter((q) => !q.completed)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">Abstract critique practice</h1>
      <p className="text-gray-600">
        Read an abstract, answer seven prompts under a timer, then get anonymous scored feedback from two peers.{' '}
        <Link href="/practice/rules" className="underline">
          Rules
        </Link>
      </p>
      <NoAiNotice />
      <AssessmentNotice />

      {dash.inProgress.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">In progress</h2>
          {dash.inProgress.map((s) => (
            <div key={s.id} className={card}>
              <span>{s.title}</span>
              <Link className={btn} href={`/practice/session/${s.id}`}>
                Resume
              </Link>
            </div>
          ))}
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">My submissions</h2>
        {dash.submissions.length === 0 && (
          <p className="text-sm text-gray-500">None yet. Submit your first session to unlock peer review.</p>
        )}
        {dash.submissions.map((s) => (
          <div key={s.id} className={card}>
            <span>
              {s.title}
              {s.status === 'hidden' && (
                <span className="ml-2 text-xs border rounded-full px-2 py-0.5 text-gray-500">hidden by moderation</span>
              )}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{s.reviewsDone}/2 reviews</span>
              <Link className={btn} href={`/practice/feedback/${s.id}`}>
                Feedback
              </Link>
            </span>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Reviews to do</h2>
        {!dash.unlocked ? (
          <p className="text-sm text-gray-500">Locked until you have submitted your own answers.</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing pending.{' '}
            <Link className="underline" href="/practice/reviews">
              Open the review queue
            </Link>
            .
          </p>
        ) : (
          pending.map((q) => (
            <div key={q.id} className={card}>
              <span>{q.title}</span>
              <Link className={btn} href={`/practice/reviews/${q.id}`}>
                Review
              </Link>
            </div>
          ))
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-1">Abstract library</h2>
        <p className="text-sm text-gray-500 mb-3">
          Only the title is shown here. The abstract appears once your timed session starts.
        </p>
        {library.length === 0 && (
          <p className="text-red-600 text-sm">
            No practice abstracts yet. Run <code>npm run seed:practice</code> (see PRACTICE.md).
          </p>
        )}
        {library.map((a) => (
          <div key={a.id} className={card}>
            <span>
              {a.title} <span className="text-sm text-gray-500">arXiv:{a.arxivId}</span>
            </span>
            <Link className={btn} href={`/practice/start/${a.id}`}>
              Practise
            </Link>
          </div>
        ))}
        <ArxivAttribution />
      </section>
    </div>
  )
}
