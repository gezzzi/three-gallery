'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Trash2, Calendar, BarChart } from 'lucide-react'
import ModelCard from '@/components/ui/ModelCard'
import { Model } from '@/types'
import { useStore } from '@/store/useStore'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export default function HistoryPage() {
  const router = useRouter()
  const [historyModels, setHistoryModels] = useState<(Model & { viewedAt: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [groupBy, setGroupBy] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const { viewHistory, clearHistory, models: storedModels } = useStore()
  const { t } = useLanguage()

  useEffect(() => {
    fetchHistoryModels()
  }, [viewHistory, groupBy])

  const fetchHistoryModels = async () => {
    setLoading(true)
    try {
      // ローカルストアから、履歴のモデルを取得
      const allModels = [...storedModels]
      const uniqueModels = Array.from(
        new Map(allModels.map(model => [model.id, model])).values()
      )
      
      // 履歴にあるモデルのみをフィルタリング
      const historyModelsWithDate = viewHistory
        .map(historyItem => {
          const model = uniqueModels.find(m => m.id === historyItem.modelId)
          if (model) {
            return {
              ...model,
              viewedAt: historyItem.viewedAt
            }
          }
          return null
        })
        .filter((item): item is (Model & { viewedAt: string }) => item !== null)
      
      // 期間でフィルタリング
      const now = new Date()
      let filteredModels = historyModelsWithDate
      
      switch (groupBy) {
        case 'today':
          filteredModels = historyModelsWithDate.filter(model => {
            const viewDate = new Date(model.viewedAt)
            return viewDate.toDateString() === now.toDateString()
          })
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filteredModels = historyModelsWithDate.filter(model => {
            const viewDate = new Date(model.viewedAt)
            return viewDate >= weekAgo
          })
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filteredModels = historyModelsWithDate.filter(model => {
            const viewDate = new Date(model.viewedAt)
            return viewDate >= monthAgo
          })
          break
      }
      
      setHistoryModels(filteredModels)
    } catch (error) {
      console.error('Error fetching history models:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = () => {
    if (confirm(t.history.clearConfirm)) {
      clearHistory()
      setHistoryModels([])
    }
  }

  const getGroupTitle = (date: string) => {
    const viewDate = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - viewDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (viewDate.toDateString() === now.toDateString()) {
      return t.history.today
    } else if (diffDays === 1) {
      return t.history.yesterday
    } else if (diffDays <= 7) {
      return t.history.thisWeek
    } else if (diffDays <= 30) {
      return t.history.thisMonth
    } else {
      return t.history.earlier
    }
  }

  // 日付でグループ化
  const groupedHistory = historyModels.reduce((groups, model) => {
    const group = getGroupTitle(model.viewedAt)
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(model)
    return groups
  }, {} as Record<string, typeof historyModels>)

  const groupOrder = [t.history.today, t.history.yesterday, t.history.thisWeek, t.history.thisMonth, t.history.earlier]

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* ヘッダー */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-600" />
            {t.history.title}
          </h1>
          <p className="mt-2 text-gray-600">
            {t.history.description}
          </p>
        </div>

        {historyModels.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {t.history.clearHistory}
          </button>
        )}
      </div>

      {/* フィルター */}
      <div className="mb-6 flex gap-2">
        {[
          { id: 'all', label: t.history.all, icon: Clock },
          { id: 'today', label: t.history.today, icon: Calendar },
          { id: 'week', label: t.history.thisWeek, icon: BarChart },
          { id: 'month', label: t.history.thisMonth, icon: Clock },
        ].map((filter) => {
          const Icon = filter.icon
          return (
            <button
              key={filter.id}
              onClick={() => setGroupBy(filter.id as typeof groupBy)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                groupBy === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {filter.label}
            </button>
          )
        })}
      </div>

      {/* 履歴統計 */}
      {historyModels.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{t.history.viewCount}</p>
                <p className="text-3xl font-bold mt-1">{viewHistory.length}</p>
              </div>
              <Clock className="h-8 w-8 opacity-50" />
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{t.history.todayViews}</p>
                <p className="text-3xl font-bold mt-1">
                  {viewHistory.filter(item => {
                    const viewDate = new Date(item.viewedAt)
                    const now = new Date()
                    return viewDate.toDateString() === now.toDateString()
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 opacity-50" />
            </div>
          </div>

          <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{t.history.uniqueViews}</p>
                <p className="text-3xl font-bold mt-1">{historyModels.length}</p>
              </div>
              <BarChart className="h-8 w-8 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* 履歴一覧 */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">{t.following.loading}</p>
          </div>
        </div>
      ) : historyModels.length > 0 ? (
        <div className="space-y-8">
          {groupOrder
            .filter(group => groupedHistory[group])
            .map((group) => (
              <div key={group}>
                <h2 className="text-lg font-semibold mb-4 text-gray-700">
                  {group} ({groupedHistory[group].length}{t.history.items})
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groupedHistory[group].map((model) => (
                    <div key={`${model.id}-${model.viewedAt}`} className="relative">
                      <ModelCard model={model} />
                      {/* 閲覧時刻表示 */}
                      <div className="absolute top-2 left-2 z-10 rounded bg-black/60 px-2 py-1 text-xs text-white">
                        {formatDate(model.viewedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-2">
            {t.history.noHistory}
          </p>
          <p className="text-gray-400 mb-6">
            {t.history.noHistoryDesc}
          </p>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            {t.history.exploreModels}
          </button>
        </div>
      )}

      {/* 履歴の説明 */}
      {historyModels.length > 0 && (
        <div className="mt-12 rounded-lg bg-gray-50 p-6">
          <h3 className="text-lg font-semibold mb-3">{t.history.aboutHistory}</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {t.history.historyInfo.map((info, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>{info}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}