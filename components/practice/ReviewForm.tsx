'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { practicePost } from '@/lib/practice/api-client'
import { ARXIV_ATTRIBUTION, CRITERIA, LIMITS, PROMPTS, type Answers, type Scores } from '@/lib/practice/constants'
import { AssessmentNotice, NoAiNotice } from './Notices'
import { ReportButton } from './ReportButton'

type Task = {
  assignmentId: string
  submissionId: string
  completed: boolean
  answers: Answers
  abstract: { title: string; abstract: string; arxivId: string | null; arxivUrl: string | null }
  review: { scores: Scores; comment: string } | null
}

export function ReviewForm({ task }: { task: Task }) {
  const router = useRouter()
  const [scores, setScores] = useState<Scores>(task.review?.scores ?? {})
  const [comment, setComment] = useState(task.review?.comment ?? '')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const readOnly = task.completed
  const complete =
    PROMPTS.every((p) => CRITERIA.every((c) => scores[p.id]?.[c.id])) && comment.trim().length >= LIMITS.minCommentChars

  function setScore(q: string, c: string, v: number) {
    setScores((s) => ({ ...s, [q]: { ...(s[q] ?? {}), [c]: v } }))
  }

  async function submit() {
    setBusy(true)
    setErr(null)
    try {
      await practicePost(`/api/practice/reviews/${task.assignmentId}`, { scores, comment })
      router.push('/practice/reviews')
      router.refresh()
    } catch (e: any) {
      setErr(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Review: {task.abstract.title}</h1>
      <NoAiNotice />
      <AssessmentNotice />
      <h2 className="text-lg font-semibold mt-6 mb-2">Abstract</h2>
      <p className="whitespace-pre-wrap bg-white border-l-4 border-primary px-4 py-3">{task.abstract.abstract}</p>
      <p className="text-sm text-gray-500 mt-2">
        Source:{' '}
        {task.abstract.arxivUrl && (
          <a className="underline" href={task.abstract.arxivUrl}>
            arXiv:{task.abstract.arxivId}
          </a>
        )}
        . {ARXIV_ATTRIBUTION}
      </p>
      <p className="text-sm text-gray-600 mt-3">The author is anonymous. Score each answer 1 (weak) to 5 (strong).</p>

      {PROMPTS.map((p, i) => (
        <div key={p.id} className="bg-white border rounded-xl p-4 mt-4">
          <h3 className="font-semibold mb-2">
            {i + 1}. {p.label}
          </h3>
          <div className="whitespace-pre-wrap bg-gray-100 rounded p-3 mb-3">
            {task.answers[p.id] || <em>(no answer)</em>}
          </div>
          <div className="flex flex-wrap gap-5 text-sm">
            {CRITERIA.map((c) => (
              <label key={c.id}>
                {c.label}:{' '}
                <select
                  className="border rounded p-1"
                  value={scores[p.id]?.[c.id] ?? ''}
                  disabled={readOnly}
                  onChange={(e) => setScore(p.id, c.id, Number(e.target.value))}
                >
                  <option value="" disabled>
                    -
                  </option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      ))}

      <label htmlFor="comment" className="block font-semibold mt-6 mb-1">
        One specific comment for the author (what was strongest, what to improve, and why)
      </label>
      <textarea
        id="comment"
        className="w-full min-h-[110px] border rounded-lg p-3"
        value={comment}
        maxLength={LIMITS.maxCommentChars}
        disabled={readOnly}
        onChange={(e) => setComment(e.target.value)}
      />
      <p className="text-sm text-gray-500">
        Specific beats general: point to a particular answer or phrase. No links or personal remarks.
      </p>
      {err && <div className="text-sm text-red-600 mt-3">{err}</div>}
      <div className="mt-4 flex items-center gap-4">
        {!readOnly && (
          <button
            onClick={submit}
            disabled={!complete || busy}
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
          >
            Submit review
          </button>
        )}
        <ReportButton type="submission" targetId={task.submissionId} />
      </div>
    </div>
  )
}
