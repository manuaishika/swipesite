'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, MessagesSquare, Reply, Send, ThumbsDown, ThumbsUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import {
  MAX_POST_CHARS,
  POST_KINDS,
  REVIEW_TEMPLATE,
  VERDICTS,
  kindMeta,
  plural,
  verdictMeta,
  type PostKind,
  type Verdict,
} from '@/lib/peer-review'
import { loginHref } from '@/lib/login-href'
import { LoginToParticipate } from '@/components/auth/LoginGate'

type Vote = { voteType: string; userId: string }
type UserLite = { id: string; name: string | null; username: string }

export interface ThreadPost {
  id: string
  content: string
  kind: string
  verdict: string | null
  upvotes: number
  downvotes: number
  createdAt: Date | string
  user: UserLite & { avatar?: string | null }
  replies: Array<{ id: string; content: string; createdAt: Date | string; user: UserLite }>
  votes: Vote[]
}

type Filter = 'all' | PostKind
type Sort = 'top' | 'new'

function Avatar({ user, size = 'md' }: { user: UserLite; size?: 'sm' | 'md' }) {
  const name = user.name || user.username
  const dim = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  return (
    <span className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-700`}>
      {name[0]?.toUpperCase()}
    </span>
  )
}

export function PeerReviewThread({
  paperId,
  posts: initialPosts,
  userId,
}: {
  paperId: string
  posts: ThreadPost[]
  /** null for visitors who aren't logged in: they can read everything but not post or vote */
  userId: string | null
}) {
  const router = useRouter()
  const here = `/paper/${paperId}#discussion`
  const [posts, setPosts] = useState(initialPosts)
  const [kind, setKind] = useState<PostKind>(initialPosts.some((p) => p.user.id === userId && p.kind === 'review') ? 'discussion' : 'review')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [draft, setDraft] = useState(kind === 'review' ? REVIEW_TEMPLATE : '')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('top')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  const counts = useMemo(() => {
    const c: Record<string, number> = { review: 0, question: 0, discussion: 0 }
    posts.forEach((p) => (c[p.kind] = (c[p.kind] ?? 0) + 1))
    return c
  }, [posts])

  const verdictCounts = useMemo(() => {
    const c: Record<string, number> = {}
    posts.forEach((p) => p.kind === 'review' && p.verdict && (c[p.verdict] = (c[p.verdict] ?? 0) + 1))
    return c
  }, [posts])
  const totalVerdicts = Object.values(verdictCounts).reduce((a, b) => a + b, 0)

  const shown = useMemo(() => {
    const list = filter === 'all' ? posts : posts.filter((p) => p.kind === filter)
    return [...list].sort((a, b) =>
      sort === 'top'
        ? b.upvotes - b.downvotes - (a.upvotes - a.downvotes) || +new Date(b.createdAt) - +new Date(a.createdAt)
        : +new Date(b.createdAt) - +new Date(a.createdAt)
    )
  }, [posts, filter, sort])

  function switchKind(next: PostKind) {
    // Swap the review template in and out, but never clobber something the user wrote.
    if (next === 'review' && !draft.trim()) setDraft(REVIEW_TEMPLATE)
    if (next !== 'review' && draft === REVIEW_TEMPLATE) setDraft('')
    setKind(next)
    setError(null)
  }

  const draftIsEmpty = !draft.trim() || draft === REVIEW_TEMPLATE
  const canPost = !posting && !draftIsEmpty && (kind !== 'review' || verdict !== null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canPost) return
    setPosting(true)
    setError(null)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, content: draft, kind, verdict: kind === 'review' ? verdict : null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not post')
      setPosts((prev) => [data.comment, ...prev])
      setDraft('')
      setVerdict(null)
      if (kind === 'review') setKind('discussion')
      setFilter('all')
      setSort('new')
      fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'comment', paperId, commentId: data.comment.id }),
      }).catch(() => {})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPosting(false)
    }
  }

  async function vote(commentId: string, voteType: 'upvote' | 'downvote') {
    if (!userId) return router.push(loginHref(here))
    const res = await fetch('/api/comments/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, voteType }),
    }).catch(() => null)
    if (!res?.ok) return
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== commentId) return p
        const existing = p.votes.find((v) => v.userId === userId)
        let up = p.upvotes
        let down = p.downvotes
        if (existing?.voteType === voteType) {
          // toggling the same vote removes it
          if (voteType === 'upvote') up--
          else down--
          return { ...p, upvotes: up, downvotes: down, votes: p.votes.filter((v) => v.userId !== userId) }
        }
        if (existing) {
          if (existing.voteType === 'upvote') up--
          else down--
        }
        if (voteType === 'upvote') up++
        else down++
        return { ...p, upvotes: up, downvotes: down, votes: [...p.votes.filter((v) => v.userId !== userId), { voteType, userId }] }
      })
    )
  }

  async function reply(commentId: string) {
    if (!replyContent.trim()) return
    const res = await fetch('/api/comments/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, content: replyContent }),
    }).catch(() => null)
    if (!res?.ok) return
    const data = await res.json()
    setPosts((prev) => prev.map((p) => (p.id === commentId ? { ...p, replies: [...p.replies, data.reply] } : p)))
    setReplyContent('')
    setReplyingTo(null)
  }

  const tabCls = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`

  return (
    <section id="discussion" className="scroll-mt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Peer review</h2>
          <p className="text-sm text-gray-500">
            {plural(counts.review, 'review')} · {plural(counts.question, 'question')} ·{' '}
            {plural(counts.discussion, 'discussion post')}
          </p>
        </div>
      </div>

      {/* community verdict */}
      {totalVerdicts > 0 && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-gray-900">Reviewers&apos; verdict</span>
            <span className="text-gray-500">{plural(totalVerdicts, 'review')}</span>
          </div>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
            {VERDICTS.map((v) =>
              verdictCounts[v.id] ? (
                <div key={v.id} className={v.bar} style={{ width: `${(verdictCounts[v.id] / totalVerdicts) * 100}%` }} />
              ) : null
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
            {VERDICTS.map((v) => (
              <span key={v.id} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${v.bar}`} />
                {v.label} {verdictCounts[v.id] ?? 0}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* composer */}
      {!userId ? (
        <div className="mt-4">
          <LoginToParticipate action="write a review or join the discussion" next={here} demo="review" />
        </div>
      ) : (
      <form onSubmit={submit} className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div role="tablist" aria-label="Post type" className="flex flex-wrap gap-1">
          {POST_KINDS.map((k) => (
            <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} onClick={() => switchKind(k.id)} className={tabCls(kind === k.id)}>
              {k.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500">{kindMeta(kind).hint}</p>

        {kind === 'review' && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700">Your verdict</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {VERDICTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={verdict === v.id}
                  onClick={() => setVerdict(v.id)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                    verdict === v.id ? `${v.badge} border-transparent ring-2 ring-primary ring-offset-1` : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <label htmlFor="post-body" className="sr-only">
          Post
        </label>
        <textarea
          id="post-body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={MAX_POST_CHARS}
          rows={kind === 'review' ? 8 : 4}
          placeholder={kind === 'question' ? 'What do you want to ask?' : 'Share your thoughts...'}
          className="mt-3 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-gray-400">Markdown supported</span>
          <button
            type="submit"
            disabled={!canPost}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post {kindMeta(kind).label.toLowerCase()}
          </button>
        </div>
      </form>
      )}

      {/* filters */}
      {posts.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {(['all', ...POST_KINDS.map((k) => k.id)] as Filter[]).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={tabCls(filter === f)}>
                {f === 'all' ? `All ${posts.length}` : `${kindMeta(f).label}s ${counts[f] ?? 0}`}
              </button>
            ))}
          </div>
          <div className="flex gap-1 text-sm">
            {(['top', 'new'] as Sort[]).map((s) => (
              <button key={s} type="button" onClick={() => setSort(s)} className={tabCls(sort === s)}>
                {s === 'top' ? 'Top' : 'New'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* posts */}
      <div className="mt-3 space-y-3">
        {shown.map((p) => {
          const myVote = p.votes.find((v) => v.userId === userId)?.voteType
          const km = kindMeta(p.kind)
          const vm = verdictMeta(p.verdict)
          return (
            <article key={p.id} id={`c-${p.id}`} className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <header className="flex flex-wrap items-center gap-2">
                <Avatar user={p.user} />
                <span className="font-semibold text-gray-900">{p.user.name || p.user.username}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${km.badge}`}>{km.label}</span>
                {vm && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${vm.badge}`}>{vm.label}</span>}
                <span className="ml-auto text-xs text-gray-400">
                  {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                </span>
              </header>
              <div className="md mt-3 text-[15px] leading-relaxed text-gray-800">
                <ReactMarkdown>{p.content}</ReactMarkdown>
              </div>
              <footer className="mt-3 flex items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => vote(p.id, 'upvote')}
                  aria-label="Upvote"
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${myVote === 'upvote' ? 'text-primary' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <ThumbsUp className={`h-4 w-4 ${myVote === 'upvote' ? 'fill-current' : ''}`} /> {p.upvotes}
                </button>
                <button
                  type="button"
                  onClick={() => vote(p.id, 'downvote')}
                  aria-label="Downvote"
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${myVote === 'downvote' ? 'text-rose-600' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  <ThumbsDown className={`h-4 w-4 ${myVote === 'downvote' ? 'fill-current' : ''}`} /> {p.downvotes}
                </button>
                <button
                  type="button"
                  onClick={() => (userId ? setReplyingTo(replyingTo === p.id ? null : p.id) : router.push(loginHref(here)))}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
                >
                  <Reply className="h-4 w-4" /> Reply{p.replies.length ? ` · ${p.replies.length}` : ''}
                </button>
              </footer>

              {(p.replies.length > 0 || replyingTo === p.id) && (
                <div className="mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
                  {p.replies.map((r) => (
                    <div key={r.id} className="flex gap-2.5">
                      <Avatar user={r.user} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">{r.user.name || r.user.username}</span>{' '}
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="md text-sm text-gray-700">
                          <ReactMarkdown>{r.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {replyingTo === p.id && (
                    <div>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        rows={3}
                        className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => reply(p.id)}
                          disabled={!replyContent.trim()}
                          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          Post reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyContent('')
                          }}
                          className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {posts.length === 0 && (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center">
          <MessagesSquare className="h-6 w-6 text-primary" />
          <p className="mt-2 font-medium text-gray-900">No reviews yet</p>
          <p className="mt-1 max-w-sm text-sm text-gray-500">Be the first to review this paper. Start with the main claim.</p>
        </div>
      )}
    </section>
  )
}
