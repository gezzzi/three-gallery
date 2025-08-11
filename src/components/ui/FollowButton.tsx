'use client'

import { useFollow } from '@/hooks/useFollow'
import { UserPlus, UserMinus } from 'lucide-react'

interface FollowButtonProps {
  userId: string
  className?: string
  showIcon?: boolean
}

export default function FollowButton({ 
  userId, 
  className = '',
  showIcon = true 
}: FollowButtonProps) {
  const { isFollowing, toggleFollow, loading } = useFollow(userId)

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      } ${className}`}
    >
      {showIcon && (
        isFollowing ? (
          <UserMinus className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )
      )}
      {loading ? '処理中...' : isFollowing ? 'フォロー中' : 'フォロー'}
    </button>
  )
}