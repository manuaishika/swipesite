import { notFound, redirect } from 'next/navigation'
import { requireUserId } from '@/lib/practice/require-user'
import { getRunnerData } from '@/lib/practice/service'
import { SessionRunner } from '@/components/practice/SessionRunner'

export const dynamic = 'force-dynamic'

export default async function SessionPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId(`/practice/session/${params.id}`)
  const data = await getRunnerData(userId, params.id)
  if (!data) notFound()
  if (data.state === 'submitted') redirect(`/practice/feedback/${data.submissionId}`)
  return (
    <SessionRunner
      sessionId={data.sessionId}
      abstract={data.abstract}
      startedMs={data.startedMs}
      deadlineMs={data.deadlineMs}
      serverNowMs={Date.now()}
    />
  )
}
