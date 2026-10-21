'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Check, Loader2, Send, Timer } from 'lucide-react'
import { practicePost } from '@/lib/practice/api-client'
import { ARXIV_ATTRIBUTION, LIMITS, PROMPTS, type Answers } from '@/lib/practice/constants'
import { ArxivLink, Card, btnPrimary, inputCls } from './ui'

type Props = {
  sessionId: string
  abstract: { title: string; abstract: string; arxivId: string | null; arxivUrl: string | null }
  startedMs: number
  deadlineMs: number
  serverNowMs: number
}

function fmt(ms: number) {
  const t = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SessionRunner({ sessionId, abstract, startedMs, deadlineMs, serverNowMs }: Props) {
  const router = useRouter()
  const key = `practice-draft:${sessionId}`
  const offset = useRef(serverNowMs - Date.now()) // corrects for client clock skew
  const [answers, setAnswers] = useState<Answers>({})
  const [left, setLeft] = useState(deadlineMs - serverNowMs)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submitted = useRef(false)
  const total = Math.max(1, deadlineMs - startedMs)

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
  const answered = PROMPTS.filter((p) => (answers[p.id] ?? '').trim().length > 0).length
  const remainingFrac = Math.min(1, Math.max(0, left / total))
  const urgent = left < 5 * 60_000
  const critical = left < 60_000
  const barColor = critical ? 'bg-red-500' : urgent ? 'bg-amber-500' : 'bg-primary'
  const timeColor = critical ? 'text-red-600' : urgent ? 'text-amber-600' : 'text-gray-900'

  return (
    <div className="min-h-screen">
      {/* timer bar */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2.5 sm:px-6">
          <Timer className={`h-5 w-5 shrink-0 ${timeColor}`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Time remaining</span>
              <span className="text-xs text-gray-500">
                {answered}/{PROMPTS.length} answered
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${remainingFrac * 100}%` }} />
            </div>
          </div>
          <strong className={`text-2xl font-semibold tabular-nums ${timeColor} ${critical ? 'animate-pulse' : ''}`}>{fmt(left)}</strong>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <Ban className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>No AI assistance.</strong> Pasting is disabled. Write your own reasoning from the abstract alone.
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* abstract stays in view while writing */}
          <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto">
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Abstract</p>
              <h1 className="mt-1 text-xl font-semibold leading-snug text-gray-900">{abstract.title}</h1>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">{abstract.abstract}</p>
              <div className="mt-5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                Source: <ArxivLink id={abstract.arxivId} url={abstract.arxivUrl} />. {ARXIV_ATTRIBUTION}
              </div>
            </Card>
          </aside>

          <div className="space-y-4">
            {expired && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                This session has expired and can no longer be submitted. Start a new one.
              </div>
            )}
            {PROMPTS.map((p, i) => {
              const val = answers[p.id] ?? ''
              const done = val.trim().length > 0
              return (
                <Card key={p.id} className="p-5 transition focus-within:border-primary focus-within:shadow-md">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        done ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <label htmlFor={p.id} className="font-semibold leading-snug text-gray-900">
                      {p.label}
                    </label>
                  </div>
                  <textarea
                    id={p.id}
                    className={`${inputCls} mt-3 min-h-[120px] resize-y leading-relaxed`}
                    value={val}
                    maxLength={LIMITS.maxAnswerChars}
                    disabled={expired}
                    placeholder="Write in your own words..."
                    onChange={(e) => update(p.id, e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault()
                      setErr('Pasting is disabled. Write your own answer.')
                    }}
                    onDrop={(e) => e.preventDefault()}
                  />
                  <div className="mt-1 text-right text-xs tabular-nums text-gray-400">
                    {val.length}/{LIMITS.maxAnswerChars}
                  </div>
                </Card>
              )
            })}

            {err && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
            <div className="flex flex-wrap items-center gap-4 pb-8">
              <button onClick={() => submit(false)} disabled={busy || expired} className={btnPrimary}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit answers
              </button>
              <span className="text-sm text-gray-500">
                Your draft is saved in this browser. At zero, your answers are submitted automatically.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
