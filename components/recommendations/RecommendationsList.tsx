'use client'

import Link from 'next/link'
import { Sparkles, ExternalLink, Heart, BookOpen } from 'lucide-react'
import { format } from 'date-fns'

interface Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  publishedDate: Date | null
  venue: string | null
  keywords: string[]
  citations: number
  likes: Array<{ id: string }>
  recommendationScore: number
  recommendationReason: string
}

interface RecommendationsListProps {
  papers: Paper[]
  userId: string
}

export function RecommendationsList({ papers }: RecommendationsListProps) {
  if (papers.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No recommendations yet</p>
        <p className="text-gray-400 mt-2">
          Start liking papers to get personalized recommendations!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {papers.map((paper) => (
        <div
          key={paper.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600">
                  {Math.round(paper.recommendationScore * 100)}% match
                </span>
              </div>
              <Link href={`/paper/${paper.id}`}>
                <h3 className="text-xl font-semibold text-gray-900 hover:text-primary mb-2">
                  {paper.title}
                </h3>
              </Link>
              <p className="text-sm text-primary mb-3">{paper.recommendationReason}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <span>{paper.authors.join(', ')}</span>
                {paper.publishedDate && (
                  <span>{format(new Date(paper.publishedDate), 'MMM yyyy')}</span>
                )}
                {paper.venue && <span>{paper.venue}</span>}
              </div>
              <p className="text-gray-700 text-sm mb-4 line-clamp-2">{paper.abstract}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  {paper.likes.length} likes
                </span>
                <span>{paper.citations} citations</span>
                {paper.keywords.slice(0, 3).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-primary-100 text-primary rounded-full text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Link
              href={`/paper/${paper.id}`}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Paper</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
