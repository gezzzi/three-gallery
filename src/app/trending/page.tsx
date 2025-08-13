'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Clock, Flame, Award } from 'lucide-react'
import ModelCard from '@/components/ui/ModelCard'
import { mockModels } from '@/lib/mockData'
import { Model } from '@/types'
import { useStore } from '@/store/useStore'

const timeRanges = [
  { id: '24h', label: '24時間', icon: Clock },
  { id: 'week', label: '週間', icon: Flame },
  { id: 'month', label: '月間', icon: Award },
  { id: 'all', label: '全期間', icon: TrendingUp },
]

const categories = [
  { id: 'all', label: 'すべて' },
  { id: 'character', label: 'キャラクター' },
  { id: 'architecture', label: '建築' },
  { id: 'vehicle', label: '乗り物' },
  { id: 'nature', label: '自然' },
  { id: 'weapon', label: '武器' },
  { id: 'animation', label: 'アニメーション' },
  { id: 'code', label: 'Three.jsコード' },
]

export default function TrendingPage() {
  const [timeRange, setTimeRange] = useState('24h')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [trendingModels, setTrendingModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const storedModels = useStore((state) => state.models)

  useEffect(() => {
    setIsLoading(true)
    
    const timer = setTimeout(() => {
      // storeのモデルとモックデータを結合（重複を排除）
      const allModels = [...storedModels, ...mockModels]
      const uniqueModels = Array.from(
        new Map(allModels.map(model => [model.id, model])).values()
      )
      
      // カテゴリでフィルタリング
      let filteredModels = uniqueModels
      if (selectedCategory !== 'all') {
        filteredModels = uniqueModels.filter(model => {
          if (selectedCategory === 'character') return model.tags.includes('キャラクター')
          if (selectedCategory === 'architecture') return model.tags.includes('建築')
          if (selectedCategory === 'vehicle') return model.tags.includes('乗り物')
          if (selectedCategory === 'nature') return model.tags.includes('自然')
          if (selectedCategory === 'weapon') return model.tags.includes('武器')
          if (selectedCategory === 'animation') return model.hasAnimation
          if (selectedCategory === 'code') return model.modelType === 'code'
          return true
        })
      }
      
      // 期間に応じてフィルタリング（デモのため現在は全て表示）
      // 実際のアプリケーションでは、createdAtを基に期間フィルタリングを実装
      
      // トレンドスコアでソート
      const sortedModels = [...filteredModels].sort((a, b) => {
        // トレンドスコア = ビュー数 + いいね数×2 + ダウンロード数×3
        const scoreA = a.viewCount + a.likeCount * 2 + a.downloadCount * 3
        const scoreB = b.viewCount + b.likeCount * 2 + b.downloadCount * 3
        return scoreB - scoreA
      })
      
      setTrendingModels(sortedModels)
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedCategory])

  const selectedTimeRange = timeRanges.find(r => r.id === timeRange)
  const Icon = selectedTimeRange?.icon || TrendingUp

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-orange-500" />
          トレンド
        </h1>
        <p className="mt-2 text-gray-600">
          今話題の3Dモデルとコンテンツ
        </p>
      </div>

      {/* 期間選択タブ */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {timeRanges.map((range) => {
            const RangeIcon = range.icon
            return (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-all ${
                  timeRange === range.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <RangeIcon className="h-4 w-4" />
                {range.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* トレンド統計 */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">最も見られた</p>
              <p className="text-2xl font-bold mt-1">
                {trendingModels[0]?.title || 'Loading...'}
              </p>
            </div>
            <Icon className="h-8 w-8 opacity-50" />
          </div>
        </div>
        
        <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">最も人気</p>
              <p className="text-2xl font-bold mt-1">
                {[...trendingModels].sort((a, b) => b.likeCount - a.likeCount)[0]?.title || 'Loading...'}
              </p>
            </div>
            <Flame className="h-8 w-8 opacity-50" />
          </div>
        </div>
        
        <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">最もDLされた</p>
              <p className="text-2xl font-bold mt-1">
                {[...trendingModels].sort((a, b) => b.downloadCount - a.downloadCount)[0]?.title || 'Loading...'}
              </p>
            </div>
            <Award className="h-8 w-8 opacity-50" />
          </div>
        </div>
      </div>

      {/* トレンドモデル一覧 */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-orange-500 mx-auto" />
            <p className="mt-4 text-gray-600">トレンドを読み込み中...</p>
          </div>
        </div>
      ) : trendingModels.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trendingModels.slice(0, 12).map((model, index) => (
              <div key={model.id} className="relative">
                {/* ランキングバッジ */}
                {index < 3 && (
                  <div className={`absolute -top-2 -left-2 z-10 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                    'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}>
                    {index + 1}
                  </div>
                )}
                <ModelCard model={model} />
              </div>
            ))}
          </div>
          
          {/* もっと見る */}
          {trendingModels.length > 12 && (
            <div className="mt-8 text-center">
              <button className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-8 py-3 font-medium text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg">
                もっと見る
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-2">
            該当するトレンドモデルが見つかりません
          </p>
          <p className="text-gray-400">
            別のカテゴリや期間を選択してみてください
          </p>
        </div>
      )}
    </div>
  )
}