'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function FetchArxivButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFetch = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/papers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxResults: 20,
          sortBy: 'submittedDate',
          sortOrder: 'descending',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh the page to show new papers
        router.refresh()
      } else {
        alert(data.error || 'Failed to fetch papers')
      }
    } catch (error) {
      alert('Error fetching papers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleFetch}
      disabled={loading}
      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium disabled:opacity-50"
    >
      {loading ? 'Fetching from ArXiv...' : 'Fetch Papers from ArXiv'}
    </button>
  )
}
