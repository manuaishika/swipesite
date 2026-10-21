'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import { practicePost } from '@/lib/practice/api-client'
import { ARXIV_ATTRIBUTION, CRITERIA, LIMITS, PROMPTS, type Answers, type Scores } from '@/lib/practice/constants'
import { NoAiNotice } from './Notices'
import { ReportButton } from './ReportButton'
import { ArxivLink, Card, Chip, btnPrimary, inputCls, scoreTone } from './ui'

type Task = {
  assignmentId: string
  submissionId: string
  completed: boolean
  answers: Answers
  abstract: { title: string; abstract: string; arxivId: string | null; arxivUrl: string | null }
  review: { scores: Scores; comment: string } | null
}

function ScorePicker({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number | undefined
  onChange: (n: number) => void
  disabled: boolean
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${label} ${n}`}
              disabled={disabled}
              onClick={() => onChange(n)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold tabular-nums transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected
                  ? `${scoreTone(n)} ring-2 ring-primary ring-offset-1`
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:hover:bg-gray-100'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ReviewForm({ task }: { task: Task }) {
  const router = useRouter()
  const [scores, setScores] = useState<Scores>(task.review?.scores ?? {})
  const [comment, setComment] = useState(task.review?.comment ?? '')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const readOnly = task.completed
  const totalScores = PROMPTS.length * CRITERIA.length
  const scored = PROMPTS.reduce((n, p) => n + CRITERIA.filter((c) => scores[p.id]?.[c.id]).length, 0)
  const commentOk = comment.trim().length >= LIMITS.minCommentChars
  const complete = scored === totalScores && commentOk

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Review a peer&apos;s critique</h1>
        <Chip tone="teal">Anonymous author</Chip>
        {readOnly && <Chip>Submitted</Chip>}
      </div>
      <div className="mb-6 max-w-3xl">
        <NoAiNotice />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto">
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">The abstract they critiqued</p>
            <h2 className="mt-1 text-lg font-semibold leading-snug text-gray-900">{task.abstract.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">{task.abstract.abstract}</p>
            <div className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-500">
              Source: <ArxivLink id={task.abstract.arxivId} url={task.abstract.arxivUrl} />. {ARXIV_ATTRIBUTION}
            </div>
          </Card>
        </aside>

        <div>
          <p className="mb-3 text-sm text-gray-600">
            Score each answer from <strong>1 (weak)</strong> to <strong>5 (strong)</strong> on three criteria.
          </p>
          <div className="space-y-4">
            {PROMPTS.map((p, i) => (
              <Card key={p.id} className="p-5">
                <h3 className="font-semibold leading-snug text-gray-900">
                  <span className="mr-2 text-primary">{i + 1}.</span>
                  {p.label}
                </h3>
                <div className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 px-4 py-3 text-[15px] leading-relaxed text-gray-800">
                  {task.answers[p.id] || <em className="text-gray-400">(no answer)</em>}
                </div>
                <div className="mt-3 divide-y divide-gray-100">
                  {CRITERIA.map((c) => (
                    <ScorePicker
                      key={c.id}
                      label={c.label}
                      value={scores[p.id]?.[c.id]}
                      disabled={readOnly}
                      onChange={(n) => setScore(p.id, c.id, n)}
                    />
                  ))}
                </div>
              </Card>
            ))}

            <Card className="p-5">
              <label htmlFor="comment" className="font-semibold text-gray-900">
                One specific comment for the author
              </label>
              <p className="mt-0.5 text-sm text-gray-500">
                What was strongest, what to improve, and why. Point to a particular answer or phrase. No links or personal
                remarks.
              </p>
              <textarea
                id="comment"
                className={`${inputCls} mt-3 min-h-[120px] resize-y`}
                value={comment}
                maxLength={LIMITS.maxCommentChars}
                disabled={readOnly}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="mt-1 flex justify-between text-xs tabular-nums text-gray-400">
                <span className={commentOk ? 'text-emerald-600' : ''}>
                  {commentOk ? 'Good to go' : `At least ${LIMITS.minCommentChars} characters`}
                </span>
                <span>
                  {comment.length}/{LIMITS.maxCommentChars}
                </span>
              </div>
            </Card>
          </div>

          <div className="sticky bottom-0 -mx-4 mt-4 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
            {err && <div className="mb-2 text-sm text-red-600">{err}</div>}
            <div className="flex flex-wrap items-center gap-4">
              {!readOnly && (
                <button onClick={submit} disabled={!complete || busy} className={btnPrimary}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit review
                </button>
              )}
              <div className="min-w-[8rem] flex-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {scored}/{totalScores} scored
                  </span>
                  <span>{commentOk ? 'comment ✓' : 'comment needed'}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(scored / totalScores) * 100}%` }} />
                </div>
              </div>
              <ReportButton type="submission" targetId={task.submissionId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
