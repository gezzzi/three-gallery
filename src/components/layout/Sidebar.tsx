'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, TrendingUp, Users, Bookmark, Heart, Settings, Tag, Clock } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: Home, label: 'ホーム', href: '/' },
  { icon: TrendingUp, label: 'トレンド', href: '/trending' },
  { icon: Users, label: 'フォロー中', href: '/following' },
  { icon: Bookmark, label: 'ブックマーク', href: '/bookmarks' },
  { icon: Heart, label: 'いいね', href: '/likes' },
  { icon: Clock, label: '履歴', href: '/history' },
  { icon: Settings, label: '設定', href: '/settings' },
]

const popularTags = [
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

export default function Sidebar() {
  const pathname = usePathname()
  const { isSidebarOpen } = useStore()
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // モバイル判定
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 初回レンダリング時はデフォルト値を使用してHydrationエラーを防ぐ
  const sidebarState = isClient ? isSidebarOpen : true

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-64px)] overflow-y-auto border border-gray-700 bg-gray-800 transition-transform duration-300",
      // モバイルではドロワーとして動作
      isMobile ? "w-64 z-40" : "w-64",
      sidebarState ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* メインメニュー */}
      <nav className="p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                    isActive
                      ? 'bg-blue-900/20 text-blue-400 font-medium'
                      : 'text-gray-300 hover:bg-gray-700'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mx-4 my-2 border-t" />

      {/* 人気のタグ */}
      <div className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-400">人気のタグ</h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Link
              key={tag}
              href={`/search?tag=${encodeURIComponent(tag)}`}
              className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-4 my-2 border-t" />

      {/* フッター */}
      <div className="p-4 text-xs text-gray-400">
        <div className="space-y-1">
          <Link href="/about" className="hover:text-gray-300">運営者</Link>
          <span className="mx-1">·</span>
          <Link href="/terms" className="hover:text-gray-300">利用規約</Link>
          <span className="mx-1">·</span>
          <Link href="/privacy" className="hover:text-gray-300">プライバシー</Link>
        </div>
        <div className="mt-2">
          © 2025 ThreeGallery
        </div>
      </div>
    </aside>
  )
}