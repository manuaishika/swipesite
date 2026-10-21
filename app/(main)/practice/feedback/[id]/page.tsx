import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Hourglass } from 'lucide-react'
import { requireUserId } from '@/lib/practice/require-user'
import { getFeedback } from '@/lib/practice/service'
import { ARXIV_ATTRIBUTION, CRITERIA, PROMPTS, type Scores } from '@/lib/practice/constants'
import { ReportButton } from '@/components/practice/ReportButton'
import { HelpfulButton } from '@/components/practice/HelpfulButton'
import { ArxivLink, Card, Chip, EmptyState, PageShell, ScoreChip, SectionTitle, btnPrimary } from '@/components/practice/ui'

export const dynamic = 'force-dynamic'

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)

function avgFor(reviews: { scores: Scores }[], q: string | null, c: string): number | null {
  const vals: number[] = []
  for (const r of reviews) {
    for (const p of PROMPTS) {
      if (q && p.id !== q) continue
      const v = r.scores[p.id]?.[c]
      if (typeof v === 'number') vals.push(v)
    }
  }
  return mean(vals)
}

export default async function FeedbackPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId(`/practice/feedback/${params.id}`)
  const f = await getFeedback(userId, params.id)
  if (!f) notFound()
  const n = f.reviews.length

  return (
    <PageShell>
      <Link href="/practice" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to practice
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Chip tone={n >= 2 ? 'teal' : 'amber'}>{n}/2 reviews received</Chip>
        <span className="text-sm text-gray-500">Reviewers are anonymous</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold leading-snug text-gray-900 sm:text-3xl">{f.abstract.title}</h1>
      <p className="mt-1 text-xs text-gray-500">
        Source: <ArxivLink id={f.abstract.arxivId} url={f.abstract.arxivUrl} />. {ARXIV_ATTRIBUTION}
      </p>

      {f.status === 'hidden' && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This submission was hidden by moderation.
        </div>
      )}

      {n === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<Hourglass className="h-5 w-5" />} title="Waiting for reviewers">
            Your submission is in the queue. Two peers will score it. In the meantime, reviewing someone else&apos;s critique is
            a great way to sharpen your own.
          </EmptyState>
          <div className="mt-4 text-center">
            <Link href="/practice/reviews" className={btnPrimary}>
              Review a peer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* headline numbers */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {CRITERIA.map((c) => (
              <Card key={c.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="text-sm text-gray-500">{c.label}</div>
                  <div className="text-xs text-gray-400">average across all prompts</div>
                </div>
                <ScoreChip value={avgFor(f.reviews, null, c.id)} />
              </Card>
            ))}
          </div>

          {/* heatmap */}
          <div className="mt-8">
            <SectionTitle hint="1 weak, 5 strong">Scores by prompt</SectionTitle>
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="px-5 py-3 font-medium">Prompt</th>
                    {CRITERIA.map((c) => (
                      <th key={c.id} className="px-3 py-3 text-center font-medium">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROMPTS.map((p, i) => (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-gray-800">
                        <span className="mr-2 font-semibold text-primary">{i + 1}.</span>
                        {p.label}
                      </td>
                      {CRITERIA.map((c) => (
                        <td key={c.id} className="px-3 py-3 text-center">
                          <ScoreChip value={avgFor(f.reviews, p.id, c.id)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* comments */}
          <div className="mt-8">
            <SectionTitle>Reviewer comments</SectionTitle>
            <div className="space-y-4">
              {f.reviews.map((r, i) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <h3 className="font-semibold text-gray-900">Reviewer {String.fromCharCode(65 + i)}</h3>
                    <div className="ml-auto hidden gap-1.5 sm:flex">
                      {CRITERIA.map((c) => (
                        <span key={c.id} title={c.label}>
                          <ScoreChip size="sm" value={avgFor([r], null, c.id)} />
                        </span>
                      ))}
                    </div>
                  </div>
                  <blockquote className="mt-3 whitespace-pre-wrap border-l-4 border-primary/40 pl-4 text-[15px] leading-relaxed text-gray-800">
                    {r.comment}
                  </blockquote>
                  <details className="group mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-primary">Per-prompt scores</summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-500">
                            <th className="py-2 pr-3 font-medium">Prompt</th>
                            {CRITERIA.map((c) => (
                              <th key={c.id} className="px-2 py-2 text-center font-medium">
                                {c.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {PROMPTS.map((p, j) => (
                            <tr key={p.id} className="border-t border-gray-50">
                              <td className="py-1.5 pr-3 text-gray-600">{j + 1}</td>
                              {CRITERIA.map((c) => (
                                <td key={c.id} className="px-2 py-1.5 text-center">
                                  <ScoreChip size="sm" value={r.scores[p.id]?.[c.id] ?? null} />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <HelpfulButton reviewId={r.id} initial={r.helpful} />
                    <ReportButton type="review" targetId={r.id} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mt-8">
        <SectionTitle>Your answers</SectionTitle>
        <div className="space-y-3">
          {PROMPTS.map((p, i) => (
            <Card key={p.id} className="p-5">
              <h3 className="text-sm font-semibold text-gray-900">
                <span className="mr-2 text-primary">{i + 1}.</span>
                {p.label}
              </h3>
              <div className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
                {f.answers[p.id] || <em className="text-gray-400">(blank)</em>}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
