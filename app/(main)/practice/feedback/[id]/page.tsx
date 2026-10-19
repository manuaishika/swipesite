import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUserId } from '@/lib/practice/require-user'
import { getFeedback } from '@/lib/practice/service'
import { ARXIV_ATTRIBUTION, CRITERIA, PROMPTS } from '@/lib/practice/constants'
import { ReportButton } from '@/components/practice/ReportButton'
import { HelpfulButton } from '@/components/practice/HelpfulButton'

export const dynamic = 'force-dynamic'

const avg = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '-')
const th = 'text-left font-medium text-gray-600 py-1 pr-3'
const td = 'py-1 pr-3 border-t'

export default async function FeedbackPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId()
  const f = await getFeedback(userId, params.id)
  if (!f) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/practice" className="text-sm underline text-primary">
        Back to practice
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Feedback: {f.abstract.title}</h1>
      <p className="text-sm text-gray-500">
        Source:{' '}
        {f.abstract.arxivUrl && (
          <a className="underline" href={f.abstract.arxivUrl}>
            arXiv:{f.abstract.arxivId}
          </a>
        )}
        . {ARXIV_ATTRIBUTION}
      </p>
      {f.status === 'hidden' && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm my-3">
          This submission was hidden by moderation.
        </div>
      )}
      <p className="mt-3">{f.reviews.length}/2 reviews received. Reviewers are anonymous.</p>

      {f.reviews.length > 0 && (
        <>
          <h2 className="text-lg font-semibold mt-6 mb-2">Average scores</h2>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={th}>Prompt</th>
                {CRITERIA.map((c) => (
                  <th key={c.id} className={th}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROMPTS.map((p, i) => (
                <tr key={p.id}>
                  <td className={td}>
                    {i + 1}. {p.label}
                  </td>
                  {CRITERIA.map((c) => (
                    <td key={c.id} className={td}>
                      {avg(f.reviews.map((r) => r.scores[p.id]?.[c.id]).filter(Boolean))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <h2 className="text-lg font-semibold mt-6 mb-2">Comments</h2>
          {f.reviews.map((r, i) => (
            <div key={r.id} className="bg-white border rounded-xl p-4 mb-3">
              <h3 className="font-semibold mb-1">Reviewer {String.fromCharCode(65 + i)}</h3>
              <p className="whitespace-pre-wrap mb-3">{r.comment}</p>
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr>
                    <th className={th}>Prompt</th>
                    {CRITERIA.map((c) => (
                      <th key={c.id} className={th}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROMPTS.map((p, j) => (
                    <tr key={p.id}>
                      <td className={td}>{j + 1}</td>
                      {CRITERIA.map((c) => (
                        <td key={c.id} className={td}>
                          {r.scores[p.id]?.[c.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between">
                <HelpfulButton reviewId={r.id} initial={r.helpful} />
                <ReportButton type="review" targetId={r.id} />
              </div>
            </div>
          ))}
        </>
      )}

      <h2 className="text-lg font-semibold mt-6 mb-2">Your answers</h2>
      {PROMPTS.map((p, i) => (
        <div key={p.id} className="mb-3">
          <h3 className="font-medium">
            {i + 1}. {p.label}
          </h3>
          <div className="whitespace-pre-wrap bg-gray-100 rounded p-3">{f.answers[p.id] || <em>(blank)</em>}</div>
        </div>
      ))}
    </div>
  )
}
