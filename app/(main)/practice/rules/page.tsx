import { AssessmentNotice, NoAiNotice } from '@/components/practice/Notices'

export default function Rules() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Practice rules</h1>
      <NoAiNotice />
      <AssessmentNotice />
      <ul className="list-disc pl-6 space-y-1 mt-4">
        <li>You declare no AI assistance before every session. Pasting into answer boxes is disabled as a deterrent; the rest relies on honesty.</li>
        <li>You can review others only after you have submitted your own answers.</li>
        <li>Each submission is reviewed by up to 2 other users. Reviews are anonymous in both directions.</li>
        <li>Reviewers score every prompt 1-5 on clarity, evidence-vs-claim reasoning and quality of alternatives, and write one specific comment.</li>
        <li>No links, personal attacks or real assessment content. Content reported by 3 different users is hidden pending manual review.</li>
        <li>Rate limits apply to starting sessions, submitting, claiming reviews and reporting.</li>
      </ul>
    </div>
  )
}
