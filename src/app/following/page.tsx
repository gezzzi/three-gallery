'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Users, UserPlus, LogIn, Loader2 } from 'lucide-react'
import ModelCard from '@/components/ui/ModelCard'
import { Model, User } from '@/types'
import { useStore } from '@/store/useStore'
import dynamic from 'next/dynamic'
import { useFollow } from '@/hooks/useFollow'
import { useLanguage } from '@/contexts/LanguageContext'

const AuthModal = dynamic(() => import('@/components/ui/AuthModal'), { ssr: false })

interface UserCardProps {
  user: User
  modelsCount: number
}

function UserCard({ user, modelsCount }: UserCardProps) {
  const { isFollowing, toggleFollow, loading } = useFollow(user.id)
  const { t } = useLanguage()
  
  return (
    <div className="rounded-lg border bg-white p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          {/* アバター */}
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user.username[0].toUpperCase()
            )}
          </div>
          
          {/* ユーザー情報 */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
            {user.bio && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{user.bio}</p>
            )}
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span>{user.followerCount} {t.following.followers}</span>
              <span>{modelsCount} {t.following.models}</span>
            </div>
          </div>
        </div>
        
        {/* フォローボタン */}
        <button
          onClick={toggleFollow}
          disabled={loading}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            isFollowing
              ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? '...' : isFollowing ? t.following.followingBtn : t.following.followBtn}
        </button>
      </div>
    </div>
  )
}

export default function FollowingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [followingModels, setFollowingModels] = useState<Model[]>([])
  const [followingUsersData, setFollowingUsersData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'models' | 'users'>('models')
  const { followingUsers, models: storedModels } = useStore()
  const { t } = useLanguage()

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchFollowingData()
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading, followingUsers])

  const fetchFollowingData = async () => {
    setLoading(true)
    try {
      // フォロー中のユーザーを取得
      const followedUsers: User[] = []
      setFollowingUsersData(followedUsers)
      
      // フォロー中のユーザーのモデルを取得
      const allModels = [...storedModels]
      const uniqueModels = Array.from(
        new Map(allModels.map(model => [model.id, model])).values()
      )
      
      // フォロー中のユーザーのモデルのみをフィルタリング
      const followedModels = uniqueModels.filter(model => 
        followingUsers.includes(model.userId)
      )
      
      // 新着順にソート
      followedModels.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      setFollowingModels(followedModels)
    } catch (error) {
      console.error('Error fetching following data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ローディング中
  if (authLoading || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600">{t.following.loading}</p>
        </div>
      </div>
    )
  }

  // 未ログイン
  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center max-w-md">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t.auth.loginRequired}</h2>
          <p className="text-gray-600 mb-6">
            {t.auth.loginRequiredToViewFollowing}
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            <div className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              {t.auth.loginSignupTitle}
            </div>
          </button>
        </div>
        
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          {t.following.title}
        </h1>
        <p className="mt-2 text-gray-600">
          {t.following.description}
        </p>
      </div>

      {/* タブ切り替え */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('models')}
            className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
              activeTab === 'models'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {t.following.works} ({followingModels.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 font-medium transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {t.following.creators} ({followingUsersData.length})
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      {activeTab === 'models' ? (
        followingModels.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {followingModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">
              {t.following.noFollowingWorks}
            </p>
            <p className="text-gray-400 mb-6">
              {t.following.followCreatorsDesc}
            </p>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
              >
              {t.following.exploreCreators}
            </button>
          </div>
        )
      ) : (
        followingUsersData.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {followingUsersData.map((userData) => {
              const userModelsCount = [...storedModels].filter(
                m => m.userId === userData.id
              ).length
              
              return (
                <UserCard
                  key={userData.id}
                  user={userData}
                  modelsCount={userModelsCount}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">
              {t.following.noFollowingUsers}
            </p>
            <p className="text-gray-400 mb-6">
              {t.following.followSomeCreators}
            </p>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
            >
              {t.following.exploreCreators}
            </button>
          </div>
        )
      )}
    </div>
  )
}