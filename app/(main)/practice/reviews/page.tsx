import Link from 'next/link'
import { requireUserId } from '@/lib/practice/require-user'
import { getDashboard } from '@/lib/practice/service'
import { AssessmentNotice, NoAiNotice } from '@/components/practice/Notices'
import { ClaimButton } from '@/components/practice/ClaimButton'

export const dynamic = 'force-dynamic'

export default async function ReviewQueue() {
  const userId = await requireUserId()
  const dash = await getDashboard(userId)
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Review queue</h1>
      <NoAiNotice />
      <AssessmentNotice />
      {dash.unlocked ? (
        <ClaimButton />
      ) : (
        <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm my-3">
          Reviewing unlocks after you submit your own answers to an abstract.{' '}
          <Link className="underline" href="/practice">
            Pick an abstract
          </Link>
          .
        </div>
      )}
      {dash.queue.map((q) => (
        <div key={q.id} className="bg-white border rounded-xl px-4 py-3 flex items-center justify-between mb-2">
          <span>
            {q.title}
            {q.completed && <span className="ml-2 text-xs border rounded-full px-2 py-0.5 text-gray-500">done</span>}
          </span>
          <Link className="underline text-primary" href={`/practice/reviews/${q.id}`}>
            {q.completed ? 'View' : 'Review'}
          </Link>
        </div>
      ))}
    </div>
  )
}
