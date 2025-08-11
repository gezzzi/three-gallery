'use client'

import { useState, useEffect } from 'react'
import ModelCard from '@/components/ui/ModelCard'
import { mockModels } from '@/lib/mockData'
import { Model } from '@/types'
import { TrendingUp, Clock, Star, Download } from 'lucide-react'

const tabs = [
  { id: 'trending', label: 'トレンド', icon: TrendingUp },
  { id: 'newest', label: '新着', icon: Clock },
  { id: 'popular', label: '人気', icon: Star },
  { id: 'downloaded', label: 'DL数順', icon: Download },
]

const timeRanges = [
  { id: '24h', label: '24時間' },
  { id: 'week', label: '週間' },
  { id: 'month', label: '月間' },
  { id: 'all', label: '全期間' },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('trending')
  const [timeRange, setTimeRange] = useState('24h')
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // モックデータを使用（将来的にはSupabaseから取得）
    setIsLoading(true)
    setTimeout(() => {
      const sortedModels = [...mockModels]
      
      switch (activeTab) {
        case 'trending':
          sortedModels.sort((a, b) => {
            const scoreA = a.viewCount + a.likeCount * 2 + a.downloadCount * 3
            const scoreB = b.viewCount + b.likeCount * 2 + b.downloadCount * 3
            return scoreB - scoreA
          })
          break
        case 'newest':
          sortedModels.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          break
        case 'popular':
          sortedModels.sort((a, b) => b.likeCount - a.likeCount)
          break
        case 'downloaded':
          sortedModels.sort((a, b) => b.downloadCount - a.downloadCount)
          break
      }
      
      setModels(sortedModels)
      setIsLoading(false)
    }, 500)
  }, [activeTab, timeRange])

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          3Dモデルを探す
        </h1>
        <p className="mt-2 text-gray-600">
          クリエイターが作成した高品質な3Dモデルを見つけよう
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
          
          {/* 期間選択 */}
          {activeTab === 'trending' && (
            <div className="flex gap-1 rounded-lg bg-white p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    timeRange === range.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* カテゴリタグ */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {['すべて', 'キャラクター', '建築', '乗り物', '自然', '武器', 'アニメーション'].map((category) => (
            <button
              key={category}
              className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
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
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {models.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
          
          {/* もっと見る */}
          <div className="mt-8 text-center">
            <button className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              もっと見る
            </button>
          </div>
        </>
      )}
    </div>
  )
}