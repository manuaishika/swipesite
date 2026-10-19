import { notFound } from 'next/navigation'
import { requireUserId } from '@/lib/practice/require-user'
import { getLibraryItem } from '@/lib/practice/service'
import { AssessmentNotice, NoAiNotice } from '@/components/practice/Notices'
import { StartForm } from '@/components/practice/StartForm'

export const dynamic = 'force-dynamic'

export default async function StartPage({ params }: { params: { id: string } }) {
  await requireUserId()
  const a = await getLibraryItem(params.id)
  if (!a) notFound()
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">{a.title}</h1>
      <p className="text-sm text-gray-500">
        Source:{' '}
        {a.arxivUrl && (
          <a className="underline" href={a.arxivUrl}>
            arXiv:{a.arxivId}
          </a>
        )}{' '}
        (via the arXiv API)
      </p>
      <NoAiNotice />
      <AssessmentNotice />
      <StartForm abstractId={a.id} />
    </div>
  )
}
