'use client'

import { useState } from 'react'
import { Loader2, Lightbulb, AlertCircle } from 'lucide-react'

interface ResearchCritiqueProps {
  userId: string
}

interface CritiqueResult {
  isIncremental: boolean
  isFoundational: boolean
  assessment: string
  strengths: string[]
  weaknesses: string[]
  potentialIssues: string[]
  suggestions: string[]
  timeInvestment: 'low' | 'medium' | 'high'
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: string
}

export function ResearchCritique({ userId }: ResearchCritiqueProps) {
  const [idea, setIdea] = useState('')
  const [context, setContext] = useState('')
  const [critiquing, setCritiquing] = useState(false)
  const [result, setResult] = useState<CritiqueResult | null>(null)
  const [error, setError] = useState('')

  const handleCritique = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!idea.trim()) {
      setError('Please describe your research idea')
      return
    }

    setCritiquing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/research/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          context: context || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to critique research idea')
        return
      }

      setResult(data.critique)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setCritiquing(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCritique} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <label htmlFor="idea" className="block text-sm font-medium text-gray-700 mb-2">
            Research Idea *
          </label>
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your research idea in detail. What problem are you trying to solve? What's your approach? What makes it novel?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={6}
            required
          />
          <p className="mt-2 text-sm text-gray-500">
            Be as detailed as possible. Include the problem statement, your proposed solution, 
            and any preliminary thoughts on methodology.
          </p>
        </div>

        <div>
          <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Context (Optional)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Any additional context: related work, your background, timeline, resources available, etc."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={critiquing || !idea.trim()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {critiquing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Lightbulb className="w-5 h-5" />
              <span>Get Critique</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Critique Results</h2>
            <div className="flex gap-4">
              <div className={`px-4 py-2 rounded-lg ${
                result.isFoundational
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {result.isFoundational ? 'Foundational Research' : 'Incremental Research'}
              </div>
              <div className={`px-4 py-2 rounded-lg ${
                result.timeInvestment === 'high'
                  ? 'bg-orange-100 text-orange-800'
                  : result.timeInvestment === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {result.timeInvestment === 'high' && 'High Time Investment'}
                {result.timeInvestment === 'medium' && 'Medium Time Investment'}
                {result.timeInvestment === 'low' && 'Low Time Investment'}
              </div>
              <div className={`px-4 py-2 rounded-lg ${
                result.riskLevel === 'high'
                  ? 'bg-red-100 text-red-800'
                  : result.riskLevel === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                Risk: {result.riskLevel}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment</h3>
            <p className="text-gray-700 leading-relaxed">{result.assessment}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Strengths
              </h4>
              <ul className="space-y-2">
                {result.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Weaknesses & Concerns
              </h4>
              <ul className="space-y-2">
                {result.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-sm text-gray-700 bg-red-50 p-3 rounded-lg">
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {result.potentialIssues.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Potential Issues to Address</h4>
              <ul className="space-y-2">
                {result.potentialIssues.map((issue, idx) => (
                  <li key={idx} className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-500" />
                Suggestions for Improvement
              </h4>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-gray-700 bg-indigo-50 p-3 rounded-lg">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4">
            <h4 className="font-semibold text-indigo-900 mb-2">Final Recommendation</h4>
            <p className="text-indigo-800">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}
