'use client'

import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageSquare, Bookmark, Users, UserPlus } from 'lucide-react'
import Link from 'next/link'

interface Activity {
  id: string
  type: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    username: string
    avatar: string | null
  }
  paper: {
    id: string
    title: string
  } | null
  targetUserId: string | null
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'save':
        return <Bookmark className="w-5 h-5 text-yellow-500" />
      case 'collaboration':
        return <Users className="w-5 h-5 text-green-500" />
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />
      default:
        return null
    }
  }

  const getActivityText = (activity: Activity) => {
    const userName = activity.user.name || activity.user.username
    switch (activity.type) {
      case 'like':
        return (
          <>
            <span className="font-semibold">{userName}</span>
            {' liked '}
            {activity.paper && (
              <Link href={`/paper/${activity.paper.id}`} className="font-semibold hover:underline">
                {activity.paper.title}
              </Link>
            )}
          </>
        )
      case 'comment':
        return (
          <>
            <span className="font-semibold">{userName}</span>
            {' commented on '}
            {activity.paper && (
              <Link href={`/paper/${activity.paper.id}`} className="font-semibold hover:underline">
                {activity.paper.title}
              </Link>
            )}
          </>
        )
      case 'save':
        return (
          <>
            <span className="font-semibold">{userName}</span>
            {' saved '}
            {activity.paper && (
              <Link href={`/paper/${activity.paper.id}`} className="font-semibold hover:underline">
                {activity.paper.title}
              </Link>
            )}
          </>
        )
      case 'collaboration':
        return (
          <>
            <span className="font-semibold">{userName}</span>
            {' posted a new collaboration opportunity'}
          </>
        )
      case 'follow':
        return (
          <>
            <span className="font-semibold">{userName}</span>
            {' started following someone'}
          </>
        )
      default:
        return `${userName} performed an action`
    }
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No activities yet. Start following people to see their activity!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="bg-white rounded-lg shadow p-4 flex items-start space-x-4"
        >
          <div className="flex-shrink-0">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900">
              {getActivityText(activity)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
