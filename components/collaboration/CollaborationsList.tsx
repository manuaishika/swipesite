'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Users, Clock, CheckCircle, XCircle, Send } from 'lucide-react'

interface Collaboration {
  id: string
  title: string
  description: string
  status: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    username: string
    avatar: string | null
  }
  requests: Array<{
    id: string
    userId: string
    status: string
  }>
  _count: {
    requests: number
  }
}

interface CollaborationsListProps {
  collaborations: Collaboration[]
  userId: string
}

export function CollaborationsList({ collaborations, userId }: CollaborationsListProps) {
  const [requesting, setRequesting] = useState<string | null>(null)

  const handleRequest = async (collaborationId: string) => {
    setRequesting(collaborationId)
    try {
      const response = await fetch('/api/collaborations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId,
        }),
      })

      if (response.ok) {
        // Refresh page or update state
        window.location.reload()
      }
    } catch (error) {
      console.error('Error requesting collaboration:', error)
    } finally {
      setRequesting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            Open
          </span>
        )
      case 'in_progress':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            In Progress
          </span>
        )
      case 'closed':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            Closed
          </span>
        )
      default:
        return null
    }
  }

  if (collaborations.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No collaborations yet</p>
        <p className="text-gray-400 mt-2">Be the first to post a collaboration opportunity!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {collaborations.map((collab) => {
        const hasRequested = collab.requests.some((r) => r.userId === userId)
        const isOwner = collab.user.id === userId

        return (
          <div
            key={collab.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{collab.title}</h3>
                  {getStatusBadge(collab.status)}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span>{collab.user.name || collab.user.username}</span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDistanceToNow(new Date(collab.createdAt), { addSuffix: true })}
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {collab._count.requests} {collab._count.requests === 1 ? 'request' : 'requests'}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">{collab.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                {isOwner ? (
                  <Link
                    href={`/collaborations/${collab.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    View Requests
                  </Link>
                ) : hasRequested ? (
                  <span className="text-sm text-gray-500 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Request Sent
                  </span>
                ) : collab.status === 'open' ? (
                  <button
                    onClick={() => handleRequest(collab.id)}
                    disabled={requesting === collab.id}
                    className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{requesting === collab.id ? 'Sending...' : 'Request to Collaborate'}</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
