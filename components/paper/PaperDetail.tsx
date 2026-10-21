'use client'

import { useState } from 'react'
import { Bookmark, Calendar, ExternalLink, Heart, Users } from 'lucide-react'
import { format } from 'date-fns'
import { areaLabel } from '@/lib/niche-core'

interface Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  doi: string | null
  arxivId: string | null
  url: string | null
  pdfUrl: string | null
  publishedDate: Date | null
  venue: string | null
  keywords: string[]
  categories: string[]
  citations: number
  views: number
  likes: Array<{
    id: string
    user: {
      id: string
      name: string | null
      username: string
    }
  }>
}

interface PaperDetailProps {
  paper: Paper
  userLiked: boolean
  userSaved?: boolean
  userId: string
}

export function PaperDetail({ paper, userLiked, userSaved = false }: PaperDetailProps) {
  const [liked, setLiked] = useState(userLiked)
  const [saved, setSaved] = useState(userSaved)
  const [likeCount, setLikeCount] = useState(paper.likes.length)

  const handleLike = async () => {
    try {
      const response = await fetch('/api/papers/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.id, liked: !liked }),
      })
      if (response.ok) {
        setLiked(!liked)
        // the like route also adds/removes the paper from the collection
        setSaved(!liked)
        setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: !liked ? 'like' : 'unlike', paperId: paper.id }),
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/papers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId: paper.id, saved: !saved }),
      })
      if (response.ok) setSaved(!saved)
    } catch (error) {
      console.error('Error toggling save:', error)
    }
  }

  const areas = Array.from(new Set(paper.categories.map(areaLabel)))
  const paperUrl = paper.url || (paper.arxivId ? `https://arxiv.org/abs/${paper.arxivId}` : null)

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
      {areas.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {areas.map((a) => (
            <span key={a} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
              {a}
            </span>
          ))}
        </div>
      )}
      <h1 className="text-xl font-bold leading-snug text-gray-900 sm:text-2xl">{paper.title}</h1>

      <div className="mt-3 space-y-1.5 text-sm text-gray-500">
        {paper.authors.length > 0 && (
          <p className="flex items-start gap-2">
            <Users className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{paper.authors.join(', ')}</span>
          </p>
        )}
        {paper.publishedDate && (
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(paper.publishedDate), 'MMMM d, yyyy')}
            {paper.venue ? ` · ${paper.venue}` : ''}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={handleLike}
          aria-pressed={liked}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            liked ? 'bg-primary text-white' : 'border border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          {liked ? 'In your picks' : 'Interested'} · {likeCount}
        </button>
        <button
          onClick={handleSave}
          aria-pressed={saved}
          title={saved ? 'Remove from collection' : 'Save to collection'}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            saved ? 'bg-amber-100 text-amber-800' : 'border border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
          {saved ? 'Saved' : 'Save'}
        </button>
        {paperUrl && (
          <a href={paperUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-primary hover:underline">
            arXiv <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {paper.pdfUrl && (
          <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-primary hover:underline">
            PDF <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Abstract</h2>
        <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">{paper.abstract}</p>
      </div>

      {paper.keywords.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {paper.keywords.map((k) => (
            <span key={k} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
              {k}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
