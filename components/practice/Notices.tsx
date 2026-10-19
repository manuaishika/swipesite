import { Ban, ShieldAlert } from 'lucide-react'
import { ARXIV_ATTRIBUTION } from '@/lib/practice/constants'

function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <div className="mt-0.5 shrink-0 text-amber-600">{icon}</div>
      <p>
        <strong className="font-semibold">{title}</strong> {children}
      </p>
    </div>
  )
}

export function NoAiNotice() {
  return (
    <Notice icon={<Ban className="h-5 w-5" />} title="No AI assistance.">
      Don&apos;t use AI tools to read, plan, draft, rewrite or check anything in a session or a review. The point is to
      practise your own reasoning from the abstract alone.
    </Notice>
  )
}

export function AssessmentNotice() {
  return (
    <Notice icon={<ShieldAlert className="h-5 w-5" />} title="No real assessment material.">
      Don&apos;t post questions, answers or recalled content from any real assessment or hiring programme. Use the
      report button on anything that looks like it.
    </Notice>
  )
}

export function Rules() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <NoAiNotice />
      <AssessmentNotice />
    </div>
  )
}

export function ArxivAttribution() {
  return <p className="text-xs text-gray-500">{ARXIV_ATTRIBUTION}</p>
}
