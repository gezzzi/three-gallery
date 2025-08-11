'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ModelCard from '@/components/ui/ModelCard'
import { mockModels } from '@/lib/mockData'
import { Model } from '@/types'
import { Search, Filter, X } from 'lucide-react'

const categories = [
  'すべて',
  'キャラクター',
  '建築',
  '乗り物',
  '自然',
  '武器',
  'アニメーション',
  'ローポリ',
  'リアル',
  'SF',
  'ファンタジー',
]

const licenses = [
  { id: 'all', label: 'すべて' },
  { id: 'CC BY', label: 'CC BY' },
  { id: 'CC BY-SA', label: 'CC BY-SA' },
  { id: 'CC BY-NC', label: 'CC BY-NC' },
  { id: 'CC BY-NC-SA', label: 'CC BY-NC-SA' },
  { id: 'CC0', label: 'CC0' },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialTag = searchParams.get('tag') || ''
  
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [results, setResults] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState({
    category: initialTag || 'すべて',
    hasAnimation: 'all' as 'all' | 'yes' | 'no',
    priceRange: 'all' as 'all' | 'free' | 'paid',
    license: 'all',
    sortBy: 'relevance' as 'relevance' | 'newest' | 'popular' | 'downloads',
  })

  const performSearch = () => {
    setIsLoading(true)
    
    setTimeout(() => {
      let filtered = [...mockModels]
      
      // テキスト検索
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter(model => 
          model.title.toLowerCase().includes(query) ||
          model.description?.toLowerCase().includes(query) ||
          model.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }
      
      // カテゴリフィルタ
      if (filters.category !== 'すべて') {
        filtered = filtered.filter(model =>
          model.tags.includes(filters.category)
        )
      }
      
      // アニメーションフィルタ
      if (filters.hasAnimation === 'yes') {
        filtered = filtered.filter(model => model.hasAnimation)
      } else if (filters.hasAnimation === 'no') {
        filtered = filtered.filter(model => !model.hasAnimation)
      }
      
      // 価格フィルタ
      if (filters.priceRange === 'free') {
        filtered = filtered.filter(model => model.isFree)
      } else if (filters.priceRange === 'paid') {
        filtered = filtered.filter(model => !model.isFree)
      }
      
      // ライセンスフィルタ
      if (filters.license !== 'all') {
        filtered = filtered.filter(model => model.licenseType === filters.license)
      }
      
      // ソート
      switch (filters.sortBy) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          break
        case 'popular':
          filtered.sort((a, b) => b.likeCount - a.likeCount)
          break
        case 'downloads':
          filtered.sort((a, b) => b.downloadCount - a.downloadCount)
          break
      }
      
      setResults(filtered)
      setIsLoading(false)
    }, 500)
  }

  useEffect(() => {
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const clearFilter = (filterType: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'category' ? 'すべて' : 'all'
    }))
  }

  return (
    <div className="min-h-screen p-6">
      {/* 検索ヘッダー */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="3Dモデルを検索..."
              className="w-full rounded-lg border bg-white py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 font-medium transition-colors ${
              showFilters ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Filter className="h-5 w-5" />
            フィルタ
          </button>
        </form>

        {/* 検索結果の概要 */}
        <div className="mt-4 text-sm text-gray-600">
          {searchQuery && (
            <span>
              「{searchQuery}」の検索結果: {results.length}件
            </span>
          )}
          {initialTag && (
            <span>
              タグ「{initialTag}」: {results.length}件
            </span>
          )}
        </div>
      </div>

      {/* フィルタパネル */}
      {showFilters && (
        <div className="mb-6 rounded-lg bg-white p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {/* カテゴリ */}
            <div>
              <label className="mb-2 block text-sm font-medium">カテゴリ</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* アニメーション */}
            <div>
              <label className="mb-2 block text-sm font-medium">アニメーション</label>
              <select
                value={filters.hasAnimation}
                onChange={(e) => setFilters({ ...filters, hasAnimation: e.target.value as 'all' | 'yes' | 'no' })}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="all">すべて</option>
                <option value="yes">あり</option>
                <option value="no">なし</option>
              </select>
            </div>

            {/* 価格 */}
            <div>
              <label className="mb-2 block text-sm font-medium">価格</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({ ...filters, priceRange: e.target.value as 'all' | 'free' | 'paid' })}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="all">すべて</option>
                <option value="free">無料</option>
                <option value="paid">有料</option>
              </select>
            </div>

            {/* ライセンス */}
            <div>
              <label className="mb-2 block text-sm font-medium">ライセンス</label>
              <select
                value={filters.license}
                onChange={(e) => setFilters({ ...filters, license: e.target.value })}
                className="w-full rounded-lg border px-3 py-2"
              >
                {licenses.map(license => (
                  <option key={license.id} value={license.id}>{license.label}</option>
                ))}
              </select>
            </div>

            {/* ソート */}
            <div>
              <label className="mb-2 block text-sm font-medium">並び順</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as 'relevance' | 'newest' | 'popular' | 'downloads' })}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="relevance">関連度順</option>
                <option value="newest">新着順</option>
                <option value="popular">人気順</option>
                <option value="downloads">DL数順</option>
              </select>
            </div>
          </div>

          {/* アクティブフィルタ */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.category !== 'すべて' && (
              <button
                onClick={() => clearFilter('category')}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                {filters.category}
                <X className="h-3 w-3" />
              </button>
            )}
            {filters.hasAnimation !== 'all' && (
              <button
                onClick={() => clearFilter('hasAnimation')}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                アニメーション: {filters.hasAnimation === 'yes' ? 'あり' : 'なし'}
                <X className="h-3 w-3" />
              </button>
            )}
            {filters.priceRange !== 'all' && (
              <button
                onClick={() => clearFilter('priceRange')}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                {filters.priceRange === 'free' ? '無料' : '有料'}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 検索結果 */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            <p className="mt-4 text-gray-600">検索中...</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Search className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg text-gray-600">検索結果が見つかりませんでした</p>
            <p className="mt-2 text-sm text-gray-500">別のキーワードでお試しください</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}