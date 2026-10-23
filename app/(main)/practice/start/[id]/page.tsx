import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { optionalUserId } from '@/lib/practice/require-user'
import { LoginToParticipate } from '@/components/auth/LoginGate'
import { getLibraryItem } from '@/lib/practice/service'
import { AssessmentNotice } from '@/components/practice/Notices'
import { StartForm } from '@/components/practice/StartForm'
import { ArxivLink, Card, Chip, PageShell } from '@/components/practice/ui'
import { DbUnavailable } from '@/components/DbUnavailable'

export const dynamic = 'force-dynamic'

export default async function StartPage({ params }: { params: { id: string } }) {
  // Anyone can look; starting a timed session needs an account.
  const userId = await optionalUserId()
  let a
  try {
    a = await getLibraryItem(params.id)
  } catch (err) {
    console.error('[practice/start] data load failed:', err)
    return <DbUnavailable />
  }
  if (!a) notFound()
  return (
    <PageShell>
      <Link href="/practice" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Chip tone="teal">Ready to practise</Chip>
        <span className="text-sm text-gray-500">
          Source: <ArxivLink id={a.arxivId} url={a.arxivUrl} /> via the arXiv API
        </span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold leading-snug text-gray-900 sm:text-3xl">{a.title}</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {userId ? (
            <StartForm abstractId={a.id} />
          ) : (
            <LoginToParticipate action="start a timed practice session" next={`/practice/start/${a.id}`} demo="practice" />
          )}
          <AssessmentNotice />
        </div>
        <Card className="h-fit p-6">
          <h2 className="text-lg font-semibold text-gray-900">What happens next</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            The abstract and the questions are shown together once the timer starts, so you read them cold, as you would
            in a real review. Nothing is revealed beforehand.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>Write your answers before the time runs out.</li>
            <li>Your answers are reviewed anonymously by other people.</li>
            <li>You review someone else&apos;s answers in return.</li>
          </ul>
        </Card>
      </div>
    </PageShell>
  )
}
