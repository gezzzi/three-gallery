'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ModelCard from '@/components/ui/ModelCard'
import { mockModels, mockUsers } from '@/lib/mockData'
import { Model, User } from '@/types'
import { formatNumber, formatDate } from '@/lib/utils'
import { 
  User as UserIcon, 
  Calendar, 
  MapPin, 
  Link as LinkIcon,
  Twitter,
  Settings,
  Grid,
  Heart,
  Bookmark,
  Users
} from 'lucide-react'

const tabs = [
  { id: 'models', label: '作品', icon: Grid },
  { id: 'likes', label: 'いいね', icon: Heart },
  { id: 'bookmarks', label: 'ブックマーク', icon: Bookmark },
]

export default function UserProfilePage() {
  const params = useParams()
  const username = params.username as string
  
  const [user, setUser] = useState<User | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [activeTab, setActiveTab] = useState('models')
  const [isFollowing, setIsFollowing] = useState(false)
  const [stats, setStats] = useState({
    totalViews: 0,
    totalDownloads: 0,
    totalLikes: 0,
  })

  useEffect(() => {
    // モックデータから該当ユーザーを取得
    const foundUser = mockUsers.find(u => u.username === username)
    if (foundUser) {
      setUser(foundUser)
      
      // ユーザーの作品を取得
      const userModels = mockModels.filter(m => m.userId === foundUser.id)
      setModels(userModels)
      
      // 統計情報を計算
      const totalStats = userModels.reduce((acc, model) => ({
        totalViews: acc.totalViews + model.viewCount,
        totalDownloads: acc.totalDownloads + model.downloadCount,
        totalLikes: acc.totalLikes + model.likeCount,
      }), { totalViews: 0, totalDownloads: 0, totalLikes: 0 })
      
      setStats(totalStats)
    }
  }, [username])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-lg text-gray-600">ユーザーが見つかりません</p>
        </div>
      </div>
    )
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    // 実際のフォロー処理をここに実装
  }

  const getTabContent = () => {
    switch (activeTab) {
      case 'models':
        return models
      case 'likes':
        // いいねした作品（モックデータ）
        return mockModels.slice(0, 2)
      case 'bookmarks':
        // ブックマークした作品（モックデータ）
        return mockModels.slice(2, 4)
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* プロフィールヘッダー */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            {/* アバター */}
            <div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-4xl font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* ユーザー情報 */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-2 flex items-center justify-center gap-3 md:justify-start">
                <h1 className="text-3xl font-bold">
                  {user.displayName || user.username}
                </h1>
                {user.isPremium && (
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-medium text-yellow-900">
                    PREMIUM
                  </span>
                )}
              </div>
              
              <p className="mb-4 text-blue-100">@{user.username}</p>
              
              {user.bio && (
                <p className="mb-4 max-w-2xl text-white/90">{user.bio}</p>
              )}

              {/* メタ情報 */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-sm text-blue-100 md:justify-start">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(user.createdAt)}から利用</span>
                </div>
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>ウェブサイト</span>
                  </a>
                )}
                {user.twitter && (
                  <a
                    href={`https://twitter.com/${user.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>@{user.twitter}</span>
                  </a>
                )}
              </div>

              {/* アクションボタン */}
              <div className="flex justify-center gap-3 md:justify-start">
                <button
                  onClick={handleFollow}
                  className={`rounded-lg px-6 py-2 font-medium transition-colors ${
                    isFollowing
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-white text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {isFollowing ? 'フォロー中' : 'フォロー'}
                </button>
                <button className="rounded-lg bg-white/20 px-6 py-2 font-medium text-white hover:bg-white/30">
                  メッセージ
                </button>
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-lg bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">{formatNumber(user.followerCount)}</p>
              <p className="text-sm text-blue-100">フォロワー</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">{formatNumber(user.followingCount)}</p>
              <p className="text-sm text-blue-100">フォロー中</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">{formatNumber(stats.totalViews)}</p>
              <p className="text-sm text-blue-100">総視聴数</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">{formatNumber(stats.totalDownloads)}</p>
              <p className="text-sm text-blue-100">総DL数</p>
            </div>
            <div className="rounded-lg bg-white/10 p-4 text-center backdrop-blur">
              <p className="text-2xl font-bold">{formatNumber(stats.totalLikes)}</p>
              <p className="text-sm text-blue-100">総いいね</p>
            </div>
          </div>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* タブナビゲーション */}
        <div className="mb-6 border-b">
          <div className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    {tab.id === 'models' ? models.length : 2}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {getTabContent().map((model) => (
            <ModelCard key={model.id} model={model} showUser={false} />
          ))}
        </div>

        {getTabContent().length === 0 && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">
                {activeTab === 'models' && 'まだ作品がありません'}
                {activeTab === 'likes' && 'いいねした作品がありません'}
                {activeTab === 'bookmarks' && 'ブックマークした作品がありません'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}