'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Bookmark, LogIn, Loader2 } from 'lucide-react'
import ModelCard from '@/components/ui/ModelCard'
import { Model } from '@/types'
import { useStore } from '@/store/useStore'
import dynamic from 'next/dynamic'

const AuthModal = dynamic(() => import('@/components/ui/AuthModal'), { ssr: false })

export default function BookmarksPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookmarkedModels, setBookmarkedModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { bookmarkedModels: bookmarkedIds, models: storedModels } = useStore()

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchBookmarkedModels()
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading, bookmarkedIds])

  const fetchBookmarkedModels = async () => {
    setLoading(true)
    try {
      // ローカルストアから、ブックマークされたモデルを取得
      const allModels = [...storedModels]
      const uniqueModels = Array.from(
        new Map(allModels.map(model => [model.id, model])).values()
      )
      
      // ブックマークされたモデルのみをフィルタリング
      const bookmarked = uniqueModels.filter(model => 
        bookmarkedIds.includes(model.id)
      )
      
      setBookmarkedModels(bookmarked)
    } catch (error) {
      console.error('Error fetching bookmarked models:', error)
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
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未ログイン
  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center max-w-md">
          <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">
            ブックマークを表示するにはログインが必要です
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            <div className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              ログイン / 新規登録
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
          <Bookmark className="h-8 w-8 text-blue-600" />
          ブックマーク
        </h1>
        <p className="mt-2 text-gray-600">
          保存したお気に入りの3Dモデル
        </p>
      </div>

      {/* ブックマーク一覧 */}
      {bookmarkedModels.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bookmarkedModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bookmark className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-2">
            ブックマークがまだありません
          </p>
          <p className="text-gray-400 mb-6">
            気に入ったモデルをブックマークして、後で簡単にアクセスできます
          </p>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            モデルを探す
          </button>
        </div>
      )}
    </div>
  )
}