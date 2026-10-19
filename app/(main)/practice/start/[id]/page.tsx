import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireUserId } from '@/lib/practice/require-user'
import { getLibraryItem } from '@/lib/practice/service'
import { PROMPTS } from '@/lib/practice/constants'
import { AssessmentNotice } from '@/components/practice/Notices'
import { StartForm } from '@/components/practice/StartForm'
import { ArxivLink, Card, Chip, PageShell } from '@/components/practice/ui'

export const dynamic = 'force-dynamic'

export default async function StartPage({ params }: { params: { id: string } }) {
  await requireUserId()
  const a = await getLibraryItem(params.id)
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
      <h1 className="mt-2 text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">{a.title}</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <StartForm abstractId={a.id} />
          <AssessmentNotice />
        </div>
        <Card className="h-fit p-6">
          <h2 className="text-lg font-semibold text-gray-900">You&apos;ll answer</h2>
          <p className="mt-0.5 text-sm text-gray-500">The abstract appears when the timer starts.</p>
          <ol className="mt-4 space-y-3">
            {PROMPTS.map((p, i) => (
              <li key={p.id} className="flex gap-3 text-sm text-gray-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
                  {i + 1}
                </span>
                <span className="pt-0.5">{p.label}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </PageShell>
  )
}
