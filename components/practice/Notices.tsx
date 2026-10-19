import { ARXIV_ATTRIBUTION } from '@/lib/practice/constants'

const box = 'bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-sm text-amber-900 my-3'

export function NoAiNotice() {
  return (
    <div className={box}>
      <strong>No AI assistance.</strong> Do not use AI tools to read, plan, draft, rewrite or check anything in a
      practice session or a review. The point is to practise your own reasoning from the abstract alone. (This is
      separate from the AI critique tool elsewhere on this site, which is not part of practice.)
    </div>
  )
}

export function AssessmentNotice() {
  return (
    <div className={box}>
      <strong>No real assessment material.</strong> Do not post questions, answers or recalled content from any real
      assessment or hiring programme. Use the report button on anything that looks like it.
    </div>
  )
}

export function ArxivAttribution() {
  return <p className="text-sm text-gray-500">{ARXIV_ATTRIBUTION}</p>
}
