'use client'

import { BookOpen, ExternalLink, Users, Calendar, Tag } from 'lucide-react'
import { format } from 'date-fns'

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
  likes: Array<{ id: string }>
}

interface PaperCardProps {
  paper: Paper
}

export function PaperCard({ paper }: PaperCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-2xl h-full flex flex-col overflow-hidden">
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">{paper.title}</h2>

        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-2">
            <Users className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Authors:</span>{' '}
                {paper.authors.join(', ')}
              </p>
            </div>
          </div>

          {paper.publishedDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <p className="text-sm text-gray-600">
                {format(new Date(paper.publishedDate), 'MMMM yyyy')}
              </p>
            </div>
          )}

          {paper.venue && (
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <p className="text-sm text-gray-600">{paper.venue}</p>
            </div>
          )}

          {paper.keywords.length > 0 && (
            <div className="flex items-start space-x-2">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex flex-wrap gap-2">
                {paper.keywords.slice(0, 5).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Abstract</h3>
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-6">
            {paper.abstract}
          </p>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>{paper.citations} citations</span>
          <span>{paper.views} views</span>
          <span>{paper.likes.length} likes</span>
        </div>
      </div>

      <div className="border-t p-4 bg-gray-50 flex justify-end space-x-2">
        {paper.pdfUrl && (
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View PDF</span>
          </a>
        )}
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Paper</span>
          </a>
        )}
      </div>
    </div>
  )
}
