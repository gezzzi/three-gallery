'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, Search, Upload, Bell, User } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const { toggleSidebar, searchQuery, setSearchQuery, currentUser } = useStore()
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm">
      {/* ロゴとメニュー */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="メニュー"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
          <span className="text-xl font-bold">ThreeGallery</span>
        </Link>
      </div>

      {/* 検索バー */}
      <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
        <div className={`relative flex items-center rounded-full border ${
          isSearchFocused ? 'border-blue-500' : 'border-gray-300'
        } bg-gray-50 px-4 py-2 transition-colors`}>
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="3Dモデルを検索..."
            className="ml-2 flex-1 bg-transparent outline-none placeholder:text-gray-400"
          />
        </div>
      </form>

      {/* 右側のアクション */}
      <div className="flex items-center gap-2">
        <Link
          href="/upload"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">アップロード</span>
        </Link>

        <button
          className="rounded-lg p-2 hover:bg-gray-100"
          aria-label="通知"
        >
          <Bell className="h-5 w-5" />
        </button>

        {currentUser ? (
          <Link href={`/user/${currentUser.username}`}>
            <div className="h-8 w-8 rounded-full bg-gray-300">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {currentUser.username[0].toUpperCase()}
                </div>
              )}
            </div>
          </Link>
        ) : (
          <button
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="ユーザーメニュー"
          >
            <User className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  )
}