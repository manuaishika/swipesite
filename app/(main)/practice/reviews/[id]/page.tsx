import { notFound } from 'next/navigation'
import { requireUserId } from '@/lib/practice/require-user'
import { getReviewTask } from '@/lib/practice/service'
import { ReviewForm } from '@/components/practice/ReviewForm'

export const dynamic = 'force-dynamic'

export default async function ReviewPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId()
  const task = await getReviewTask(userId, params.id)
  if (!task) notFound()
  return <ReviewForm task={task} />
}
