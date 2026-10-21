'use client'

import Link from 'next/link'
import { BookOpen, Heart, Bookmark, MessageSquare, Users } from 'lucide-react'

interface User {
  id: string
  name: string | null
  username: string
  bio: string | null
  interests: string[]
  likedPapers: Array<{
    paper: {
      id: string
      title: string
    }
  }>
  savedPapers: Array<{
    paper: {
      id: string
      title: string
    }
  }>
  _count: {
    likedPapers: number
    savedPapers: number
    comments: number
    collaborations: number
    followers: number
    following: number
  }
}

interface UserProfileProps {
  user: User
  isOwnProfile: boolean
}

export function UserProfile({ user, isOwnProfile }: UserProfileProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex items-start space-x-6 mb-6">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-indigo-600 text-2xl font-semibold">
            {(user.name || user.username)[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            {user.name || user.username}
          </h1>
          <p className="text-gray-600 mb-2">@{user.username}</p>
          {user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}
          {user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 pb-8 border-b">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900">{user._count.likedPapers}</div>
          <div className="text-sm text-gray-600">Liked Papers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900">{user._count.savedPapers}</div>
          <div className="text-sm text-gray-600">Saved Papers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900">{user._count.comments}</div>
          <div className="text-sm text-gray-600">Comments</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900">{user._count.followers}</div>
          <div className="text-sm text-gray-600">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900">{user._count.following}</div>
          <div className="text-sm text-gray-600">Following</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-red-500" />
            Liked Papers
          </h2>
          {user.likedPapers.length > 0 ? (
            <div className="space-y-2">
              {user.likedPapers.map((like) => (
                <Link
                  key={like.paper.id}
                  href={`/paper/${like.paper.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="text-gray-900 font-medium">{like.paper.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No liked papers yet</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Bookmark className="w-5 h-5 mr-2 text-yellow-500" />
            Saved Papers
          </h2>
          {user.savedPapers.length > 0 ? (
            <div className="space-y-2">
              {user.savedPapers.map((save) => (
                <Link
                  key={save.paper.id}
                  href={`/paper/${save.paper.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="text-gray-900 font-medium">{save.paper.title}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No saved papers yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
