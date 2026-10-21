'use client'

import { useState } from 'react'

export default function ImportPage() {
  const [formData, setFormData] = useState({
    searchQuery: '',
    category: '',
    maxResults: 20,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    imported: number
    skipped: number
    total: number
  } | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/papers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: formData.searchQuery,
          category: formData.category,
          maxResults: parseInt(formData.maxResults.toString()),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to import papers')
        return
      }

      setResult(data)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const commonCategories = [
    { value: 'cs.AI', label: 'AI' },
    { value: 'cs.CV', label: 'Computer Vision' },
    { value: 'cs.LG', label: 'Machine Learning' },
    { value: 'cs.CL', label: 'Computation and Language (NLP)' },
    { value: 'cs.NE', label: 'Neural and Evolutionary Computing' },
    { value: 'cs.IR', label: 'Information Retrieval' },
    { value: 'stat.ML', label: 'Machine Learning (Statistics)' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-900 mb-6">Import Papers from ArXiv</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold">Import Complete!</p>
            <p>
              Imported: {result.imported} | Skipped: {result.skipped} | Total: {result.total}
            </p>
          </div>
        )}

        <div>
          <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
            Search Query (optional)
          </label>
          <input
            id="searchQuery"
            type="text"
            value={formData.searchQuery}
            onChange={(e) => setFormData({ ...formData, searchQuery: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., transformer, attention mechanism, deep learning"
          />
          <p className="mt-1 text-sm text-gray-500">
            Leave empty to fetch recent papers in the selected category
          </p>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category (optional)
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {commonCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label} ({cat.value})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Papers (max 100)
          </label>
          <input
            id="maxResults"
            type="number"
            min="1"
            max="100"
            value={formData.maxResults}
            onChange={(e) => setFormData({ ...formData, maxResults: parseInt(e.target.value) || 20 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Import Papers'}
          </button>
        </div>
      </form>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Start with a category to get relevant papers</li>
          <li>Use search query for specific topics (e.g., &quot;transformer&quot;, &quot;GAN&quot;, &quot;reinforcement learning&quot;)</li>
          <li>ArXiv API may take a few seconds to respond</li>
          <li>Duplicate papers (same ArXiv ID) will be skipped automatically</li>
        </ul>
      </div>
    </div>
  )
}
