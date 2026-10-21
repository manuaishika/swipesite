import Link from 'next/link'
import { ArrowRight, CheckCircle2, Inbox, Lock } from 'lucide-react'
import { requireUserId } from '@/lib/practice/require-user'
import { getDashboard } from '@/lib/practice/service'
import { Rules } from '@/components/practice/Notices'
import { ClaimButton } from '@/components/practice/ClaimButton'
import { Card, Chip, EmptyState, PageShell, SectionTitle, btnSecondary } from '@/components/practice/ui'

export const dynamic = 'force-dynamic'

export default async function ReviewQueue() {
  const userId = await requireUserId('/practice/reviews')
  const dash = await getDashboard(userId)
  const pending = dash.queue.filter((q) => !q.completed)
  const done = dash.queue.filter((q) => q.completed)
  return (
    <PageShell>
      <h1 className="text-3xl font-semibold text-gray-900">Review queue</h1>
      <p className="mt-1 text-gray-600">
        Score a peer&apos;s critique on clarity, evidence-vs-claim reasoning and alternatives, and leave one specific comment.
      </p>
      <div className="mt-5">
        <Rules />
      </div>

      <Card className="mt-6 p-6">
        {dash.unlocked ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Ready for another?</h2>
              <p className="text-sm text-gray-500">You can hold up to 3 unfinished reviews at a time.</p>
            </div>
            <ClaimButton />
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Reviewing unlocks after you submit</h2>
              <p className="mt-0.5 text-sm text-gray-500">Write your own critique first, so everyone gives as much as they get.</p>
              <Link href="/practice" className={`${btnSecondary} mt-3`}>
                Pick an abstract <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-8">
        <SectionTitle hint={`${pending.length} to do`}>Your reviews</SectionTitle>
        {dash.queue.length === 0 ? (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="Nothing here yet">
            Claimed reviews show up here.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {[...pending, ...done].map((q) => (
              <Link
                key={q.id}
                href={`/practice/reviews/${q.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:border-primary"
              >
                <span className="font-medium text-gray-900">{q.title}</span>
                {q.completed ? (
                  <Chip tone="teal">
                    <CheckCircle2 className="h-3 w-3" /> Done
                  </Chip>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Review <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
