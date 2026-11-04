'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { emptyProgress, emptyStats, finishLesson, place, type Outcome, type QuestStatsState, type TrackProgress, type TrackShape } from '@/lib/quest/engine'

// Quest progress: on the server for signed-in people, in this browser for guests (imported on sign-up).
export const LOCAL_KEY = 'rs-quest'
type State = { stats: QuestStatsState; tracks: Record<string, TrackProgress> }
const blank = (): State => ({ stats: emptyStats(), tracks: {} })

export function readLocal(): State {
  try {
    const s = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')
    return s?.stats ? s : blank()
  } catch {
    return blank()
  }
}
const writeLocal = (s: State) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(s))
  } catch {}
}

export type PlaceOutcome = { stats: QuestStatsState; progress: TrackProgress; level: number; earned: string[]; xp: number }

export function useQuest() {
  const { status } = useSession()
  const [state, setState] = useState<State>(blank)
  const [ready, setReady] = useState(false)
  const guest = status !== 'authenticated'

  useEffect(() => {
    if (status === 'loading') return
    if (guest) {
      setState(readLocal())
      setReady(true)
      return
    }
    fetch('/api/quest', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.stats && setState({ stats: d.stats, tracks: d.tracks ?? {} }))
      .finally(() => setReady(true))
  }, [status, guest])

  const progress = useCallback((id: string) => state.tracks[id] ?? emptyProgress(), [state])

  const commit = useCallback(
    async <T extends { stats: QuestStatsState; progress: TrackProgress }>(trackId: string, local: T | null, body: Record<string, unknown>): Promise<T | null> => {
      if (!local) return null
      // optimistic: show the result straight away; the server applies the same rules
      setState((s) => {
        const next = { stats: local.stats, tracks: { ...s.tracks, [trackId]: local.progress } }
        if (guest) writeLocal(next)
        return next
      })
      if (guest) return local
      const res = await fetch('/api/quest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track: trackId, ...body }) }).catch(() => null)
      const server = res?.ok ? ((await res.json()) as T) : null
      if (server) setState((s) => ({ stats: server.stats, tracks: { ...s.tracks, [trackId]: server.progress } }))
      return server ?? local
    },
    [guest],
  )

  const lesson = useCallback(
    (shape: TrackShape, lessonId: string, score: number) =>
      commit<Outcome>(shape.id, finishLesson(shape, state.stats, progress(shape.id), lessonId, score), { action: 'lesson', lessonId, score }),
    [commit, state.stats, progress],
  )
  const placement = useCallback(
    (trackId: string, level: number, score: number) =>
      commit<PlaceOutcome>(trackId, place(state.stats, progress(trackId), level, score), { action: 'place', level, score }),
    [commit, state.stats, progress],
  )

  return { ready, guest, stats: state.stats, progress, lesson, placement }
}
