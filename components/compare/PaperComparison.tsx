'use client'

import { useState } from 'react'
import { Search, ArrowRight, Loader2 } from 'lucide-react'
import { PaperCard } from '../paper/PaperCard'

interface Paper {
  id: string
  title: string
  abstract: string
  authors: string[]
  keywords: string[]
  categories: string[]
  citations: number
  publishedDate: Date | null
  venue: string | null
}

interface PaperComparisonProps {
  papers: Paper[]
  userId: string
}

interface ComparisonResult {
  morePromising: 'paper1' | 'paper2' | 'equal'
  reasoning: string
  paper1Strengths: string[]
  paper2Strengths: string[]
  paper1Weaknesses: string[]
  paper2Weaknesses: string[]
  recommendation: string
}

export function PaperComparison({ papers, userId }: PaperComparisonProps) {
  const [paper1, setPaper1] = useState<Paper | null>(null)
  const [paper2, setPaper2] = useState<Paper | null>(null)
  const [search1, setSearch1] = useState('')
  const [search2, setSearch2] = useState('')
  const [comparing, setComparing] = useState(false)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState('')

  const filteredPapers1 = papers.filter((p) =>
    p.title.toLowerCase().includes(search1.toLowerCase()) ||
    p.abstract.toLowerCase().includes(search1.toLowerCase())
  )

  const filteredPapers2 = papers.filter((p) =>
    p.title.toLowerCase().includes(search2.toLowerCase()) ||
    p.abstract.toLowerCase().includes(search2.toLowerCase())
  )

  const handleCompare = async () => {
    if (!paper1 || !paper2) {
      setError('Please select both papers to compare')
      return
    }

    if (paper1.id === paper2.id) {
      setError('Please select two different papers')
      return
    }

    setComparing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/papers/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper1Id: paper1.id,
          paper2Id: paper2.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to compare papers')
        return
      }

      setResult(data.comparison)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setComparing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Paper Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Paper 1 Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select First Paper</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search papers..."
              value={search1}
              onChange={(e) => setSearch1(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredPapers1.map((paper) => (
              <button
                key={paper.id}
                onClick={() => setPaper1(paper)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  paper1?.id === paper.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-sm text-gray-900 line-clamp-2">{paper.title}</p>
                <p className="text-xs text-gray-500 mt-1">{paper.authors.slice(0, 2).join(', ')}</p>
              </button>
            ))}
            {filteredPapers1.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No papers found</p>
            )}
          </div>
          {paper1 && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm font-medium text-indigo-900">Selected:</p>
              <p className="text-sm text-indigo-700">{paper1.title}</p>
            </div>
          )}
        </div>

        {/* Paper 2 Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Second Paper</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search papers..."
              value={search2}
              onChange={(e) => setSearch2(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredPapers2.map((paper) => (
              <button
                key={paper.id}
                onClick={() => setPaper2(paper)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  paper2?.id === paper.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-sm text-gray-900 line-clamp-2">{paper.title}</p>
                <p className="text-xs text-gray-500 mt-1">{paper.authors.slice(0, 2).join(', ')}</p>
              </button>
            ))}
            {filteredPapers2.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No papers found</p>
            )}
          </div>
          {paper2 && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
              <p className="text-sm font-medium text-indigo-900">Selected:</p>
              <p className="text-sm text-indigo-700">{paper2.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compare Button */}
      <div className="flex justify-center">
        <button
          onClick={handleCompare}
          disabled={!paper1 || !paper2 || comparing}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {comparing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Comparing...</span>
            </>
          ) : (
            <>
              <span>Compare Papers</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {result && (
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Comparison Results</h2>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              result.morePromising === 'paper1'
                ? 'bg-green-100 text-green-800'
                : result.morePromising === 'paper2'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {result.morePromising === 'paper1' && 'First paper is more promising'}
              {result.morePromising === 'paper2' && 'Second paper is more promising'}
              {result.morePromising === 'equal' && 'Both papers are equally promising'}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reasoning</h3>
            <p className="text-gray-700 leading-relaxed">{result.reasoning}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">First Paper Strengths</h4>
              <ul className="space-y-1">
                {result.paper1Strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
              {result.paper1Weaknesses.length > 0 && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">Weaknesses</h4>
                  <ul className="space-y-1">
                    {result.paper1Weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-red-500 mr-2">✗</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Second Paper Strengths</h4>
              <ul className="space-y-1">
                {result.paper2Strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
              {result.paper2Weaknesses.length > 0 && (
                <>
                  <h4 className="font-semibold text-gray-900 mb-2 mt-4">Weaknesses</h4>
                  <ul className="space-y-1">
                    {result.paper2Weaknesses.map((weakness, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                        <span className="text-red-500 mr-2">✗</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4">
            <h4 className="font-semibold text-indigo-900 mb-2">Recommendation</h4>
            <p className="text-indigo-800">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
