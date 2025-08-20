'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Menu, Search, Upload, Bell, User, LogOut, Settings } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'

const AuthModal = dynamic(() => import('@/components/ui/AuthModal'), { ssr: false })
const NotificationDropdown = dynamic(() => import('@/components/ui/NotificationDropdown'), { ssr: false })

export default function Header() {
  const router = useRouter()
  const { toggleSidebar, searchQuery, setSearchQuery, unreadNotificationCount, setNotifications } = useStore()
  const { user, signOut, loading } = useAuth()
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  // 通知を取得
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
    // 30秒ごとに通知を更新
    const interval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(interval)
  }, [user, setNotifications])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-2 sm:gap-4 border-b bg-white px-2 sm:px-4 shadow-sm">
      {/* ロゴとメニュー */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 sm:p-2 hover:bg-gray-100"
          aria-label="メニュー"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
          <span className="hidden sm:inline text-xl font-bold">ThreeGallery</span>
        </Link>
      </div>

      {/* デスクトップ検索バー */}
      <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
        <div className={`relative flex items-center rounded-full border ${
          isSearchFocused ? 'border-blue-500' : 'border-gray-300'
        } bg-gray-50 px-4 py-2 transition-colors w-full`}>
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

      {/* モバイル検索ボタン */}
      <button
        onClick={() => setShowMobileSearch(!showMobileSearch)}
        className="md:hidden rounded-lg p-2 hover:bg-gray-100"
        aria-label="検索"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* 右側のアクション */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        <Link
          href="/upload"
          className="flex items-center gap-1 sm:gap-2 rounded-lg bg-blue-600 px-2 sm:px-4 py-1.5 sm:py-2 font-medium text-white hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">アップロード</span>
        </Link>

        {user && (
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-1.5 sm:p-2 hover:bg-gray-100"
              aria-label="通知"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>
        )}

        {!loading && (
          user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-8 w-8 rounded-full bg-gray-300 hover:ring-2 hover:ring-blue-500 transition-all"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="ユーザー"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm font-medium">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
              </button>
              
              {/* ユーザーメニュードロップダウン */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg border z-50">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    プロフィール
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    設定
                  </Link>
                  <hr className="my-2" />
                  <button
                    onClick={() => {
                      signOut()
                      setShowUserMenu(false)
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="rounded-lg px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              ログイン
            </button>
          )
        )}
      </div>
      
      {/* モバイル検索バー */}
      {showMobileSearch && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b p-2 md:hidden z-40">
          <form onSubmit={(e) => {
            handleSearch(e)
            setShowMobileSearch(false)
          }}>
            <div className="relative flex items-center rounded-full border border-gray-300 bg-gray-50 px-4 py-2">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="3Dモデルを検索..."
                className="ml-2 flex-1 bg-transparent outline-none placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </form>
        </div>
      )}
      
      {/* 認証モーダル */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </header>
  )
}