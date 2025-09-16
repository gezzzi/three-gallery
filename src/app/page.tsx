'use client'

import { useState, useEffect } from 'react'
import ModelCard from '@/components/ui/ModelCard'
import { Model } from '@/types'
import { Zap, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const tabs = [
  { id: 'newest', label: '新着', icon: Zap },
  { id: 'popular', label: '人気', icon: Heart },
]

const ITEMS_PER_PAGE = 12 // 1ページあたりの表示件数

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('newest')
  const [allModels, setAllModels] = useState<Model[]>([]) // 全てのモデル
  const [displayModels, setDisplayModels] = useState<Model[]>([]) // 表示中のモデル
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE) // 現在の表示件数
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false) // もっと見る読み込み中

  // モデルの取得とソート処理
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true)
      
      try {
        // Supabaseからモデルを取得
        const { data: supabaseModels, error } = await supabase
          .from('models')
          .select('*')
          .eq('status', 'public')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching models:', error)
          // エラー時は空配列を使用
          sortAndSetModels([])
        } else if (supabaseModels) {
          // Supabaseのデータを適切な形式に変換
          const formattedModels: Model[] = supabaseModels.map(model => ({
            id: model.id,
            userId: model.user_id,
            title: model.title,
            description: model.description || '',
            thumbnailUrl: model.thumbnail_url || '/placeholder-3d.svg',
            fileUrl: model.file_url,
            previewUrl: model.preview_url,
            originalFileUrl: model.original_file_url,
            metadata: model.metadata || {},
            tags: model.tags || [],
            viewCount: model.view_count || 0,
            likeCount: model.like_count || 0,
            createdAt: model.created_at,
            updatedAt: model.updated_at || model.created_at,
            status: model.status || 'public',
            licenseType: model.license_type || 'CC BY',
            isCommercialOk: model.is_commercial_ok || false,
            fileSize: model.file_size || 0,
            uploadType: model.upload_type, // upload_typeを追加
            // BGMデータを追加
            musicType: model.bgm_type || (model.metadata?.music_type as string) || undefined,
            musicUrl: model.bgm_url || (model.metadata?.music_url as string) || undefined,
            musicName: model.bgm_name || (model.metadata?.music_name as string) || undefined
          }))
          
          // Supabaseのデータのみを使用（ローカルストアは使用しない）
          sortAndSetModels(formattedModels)
        } else {
          // データがない場合は空配列を使用
          sortAndSetModels([])
        }
      } catch (error) {
        console.error('Error in fetchModels:', error)
        // エラー時は空配列を使用
        sortAndSetModels([])
      }
    }
    
    const sortAndSetModels = (models: Model[]) => {
      // ソート処理
      const sortedModels = [...models]
      
      switch (activeTab) {
        case 'newest':
          sortedModels.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          break
        case 'popular':
          sortedModels.sort((a, b) => b.likeCount - a.likeCount)
          break
      }
      
      // 全モデルを保存し、初期表示分だけ表示
      setAllModels(sortedModels)
      setDisplayModels(sortedModels.slice(0, displayCount))
      setIsLoading(false)
    }
    
    fetchModels()
  }, [activeTab, displayCount])

  // もっと見るボタンのクリックハンドラ
  const handleLoadMore = () => {
    setIsLoadingMore(true)
    
    // 少し遅延を入れてローディング状態を見せる
    setTimeout(() => {
      const newDisplayCount = displayCount + ITEMS_PER_PAGE
      setDisplayCount(newDisplayCount)
      setDisplayModels(allModels.slice(0, newDisplayCount))
      setIsLoadingMore(false)
    }, 300)
  }

  // タブ切り替え時に表示件数をリセット
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setDisplayCount(ITEMS_PER_PAGE)
  }


  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* ヘッダー */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
          Three.js作品を探す
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-400">
          クリエイターが作成した魅力的なThree.js作品を見つけよう
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
          
        </div>
      </div>

      {/* カテゴリタグ */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {['すべて', 'キャラクター', '建築', '乗り物', '自然', '武器', 'アニメーション'].map((category) => (
            <button
              key={category}
              className="rounded-full border border-gray-600 bg-gray-800 px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-300 hover:border-blue-400 hover:text-blue-400 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* モデル一覧 */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
            <p className="mt-4 text-gray-400">読み込み中...</p>
          </div>
        </div>
      ) : (
        <>
          {displayModels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">作品が見つかりませんでした</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayModels.map((model) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          )}
          
          {/* もっと見る */}
          {displayModels.length < allModels.length && (
            <div className="mt-8 text-center">
              <button 
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="rounded-lg border border-gray-600 bg-gray-800 px-6 py-2 font-medium text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    読み込み中...
                  </span>
                ) : (
                  `もっと見る (${displayModels.length}/${allModels.length})`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}