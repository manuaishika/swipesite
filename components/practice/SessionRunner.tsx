'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { practicePost } from '@/lib/practice/api-client'
import { ARXIV_ATTRIBUTION, LIMITS, PROMPTS, type Answers } from '@/lib/practice/constants'
import { NoAiNotice } from './Notices'

type Props = {
  sessionId: string
  abstract: { title: string; abstract: string; arxivId: string | null; arxivUrl: string | null }
  deadlineMs: number
  serverNowMs: number
}

function fmt(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

export function SessionRunner({ sessionId, abstract, deadlineMs, serverNowMs }: Props) {
  const router = useRouter()
  const key = `practice-draft:${sessionId}`
  const offset = useRef(serverNowMs - Date.now()) // corrects for client clock skew
  const [answers, setAnswers] = useState<Answers>({})
  const [left, setLeft] = useState(deadlineMs - serverNowMs)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submitted = useRef(false)

  useEffect(() => {
    try {
      const d = localStorage.getItem(key)
      if (d) setAnswers(JSON.parse(d))
    } catch {}
  }, [key])

  const submit = useCallback(
    async (auto: boolean) => {
      if (submitted.current) return
      submitted.current = true
      setBusy(true)
      setErr(null)
      const body: Answers = {}
      PROMPTS.forEach((p) => {
        body[p.id] = answers[p.id] ?? ''
      })
      try {
        const { submissionId } = await practicePost(`/api/practice/sessions/${sessionId}/submit`, { answers: body })
        try {
          localStorage.removeItem(key)
        } catch {}
        router.push(`/practice/feedback/${submissionId}`)
      } catch (e: any) {
        submitted.current = false
        setBusy(false)
        setErr(auto ? `Time is up, but submitting failed: ${e.message}` : e.message)
      }
    },
    [answers, key, router, sessionId]
  )

  useEffect(() => {
    const id = setInterval(() => setLeft(deadlineMs - (Date.now() + offset.current)), 500)
    return () => clearInterval(id)
  }, [deadlineMs])

  useEffect(() => {
    if (left <= 0 && !submitted.current) submit(true)
  }, [left, submit])

  function update(id: string, value: string) {
    const next = { ...answers, [id]: value }
    setAnswers(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }

  const expired = left <= -LIMITS.submitGraceMs
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div
        className={`sticky top-0 z-10 bg-white border rounded-lg px-4 py-2 flex justify-between items-center mb-3 ${
          left < 5 * 60_000 ? 'text-red-600' : ''
        }`}
      >
        <span className="text-sm text-gray-600">Time remaining</span>
        <strong className="text-2xl tabular-nums">{fmt(left)}</strong>
      </div>
      <NoAiNotice />
      <h1 className="text-2xl font-bold mt-4 mb-2">{abstract.title}</h1>
      <p className="whitespace-pre-wrap bg-white border-l-4 border-primary px-4 py-3">{abstract.abstract}</p>
      <p className="text-sm text-gray-500 mt-2">
        Source:{' '}
        {abstract.arxivUrl ? (
          <a className="underline" href={abstract.arxivUrl} target="_blank" rel="noreferrer">
            arXiv:{abstract.arxivId}
          </a>
        ) : (
          'arXiv'
        )}
        . {ARXIV_ATTRIBUTION}
      </p>
      {expired && (
        <div className="text-red-600 my-3">This session has expired and can no longer be submitted. Start a new one.</div>
      )}
      {PROMPTS.map((p, i) => (
        <div key={p.id} className="mt-5">
          <label htmlFor={p.id} className="block font-semibold mb-1">
            {i + 1}. {p.label}
          </label>
          <textarea
            id={p.id}
            className="w-full min-h-[110px] border rounded-lg p-3"
            value={answers[p.id] ?? ''}
            maxLength={LIMITS.maxAnswerChars}
            disabled={expired}
            onChange={(e) => update(p.id, e.target.value)}
            onPaste={(e) => {
              e.preventDefault()
              setErr('Pasting is disabled. Write your own answer.')
            }}
            onDrop={(e) => e.preventDefault()}
          />
        </div>
      ))}
      {err && <div className="text-red-600 mt-3 text-sm">{err}</div>}
      <button
        onClick={() => submit(false)}
        disabled={busy || expired}
        className="mt-5 px-5 py-2.5 rounded-lg bg-primary text-white font-medium disabled:opacity-50"
      >
        Submit answers
      </button>
      <p className="text-sm text-gray-500 mt-2">
        Your draft is saved in this browser. When the timer reaches zero your answers are submitted automatically.
      </p>
    </div>
  )
}
