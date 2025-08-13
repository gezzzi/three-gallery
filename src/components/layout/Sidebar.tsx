'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, TrendingUp, Users, Bookmark, Heart, Settings, Tag, Clock, ShoppingBag } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: Home, label: 'ホーム', href: '/' },
  { icon: TrendingUp, label: 'トレンド', href: '/trending' },
  { icon: Users, label: 'フォロー中', href: '/following' },
  { icon: Bookmark, label: 'ブックマーク', href: '/bookmarks' },
  { icon: Heart, label: 'いいね', href: '/likes' },
  { icon: Clock, label: '履歴', href: '/history' },
  { icon: ShoppingBag, label: '購入', href: '/purchases' },
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

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 初回レンダリング時はデフォルト値を使用してHydrationエラーを防ぐ
  const sidebarState = isClient ? isSidebarOpen : true

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-64px)] w-64 overflow-y-auto border-r bg-white transition-transform duration-300",
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
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
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
        <h3 className="mb-3 text-sm font-semibold text-gray-600">人気のタグ</h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Link
              key={tag}
              href={`/search?tag=${encodeURIComponent(tag)}`}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-4 my-2 border-t" />

      {/* フッター */}
      <div className="p-4 text-xs text-gray-500">
        <div className="space-y-1">
          <Link href="/about" className="hover:text-gray-700">会社概要</Link>
          <span className="mx-1">·</span>
          <Link href="/terms" className="hover:text-gray-700">利用規約</Link>
          <span className="mx-1">·</span>
          <Link href="/privacy" className="hover:text-gray-700">プライバシー</Link>
        </div>
        <div className="mt-2">
          © 2025 ThreeGallery
        </div>
      </div>
    </aside>
  )
}