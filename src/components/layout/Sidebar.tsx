'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, TrendingUp, Users, Heart, Settings, Clock, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: Home, label: 'ホーム', href: '/' },
  { icon: TrendingUp, label: 'トレンド', href: '/trending' },
  { icon: Upload, label: 'アップロード', href: '/upload' },
  { icon: Users, label: 'フォロー中', href: '/following' },
  { icon: Heart, label: 'いいね', href: '/likes' },
  { icon: Clock, label: '履歴', href: '/history' },
  { icon: Settings, label: '設定', href: '/settings' },
]


export default function Sidebar() {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <aside 
      className="hidden md:block fixed left-0 top-16 h-[calc(100vh-64px)] z-30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn(
        "h-full border-r border-gray-700/50 bg-gray-800/50 backdrop-blur-sm transition-all duration-300 flex items-center",
        isHovered ? "w-64" : "w-16"
      )}>
        {/* メインメニュー */}
        <nav className="p-2 w-full -mt-32">
          <ul className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                      isActive
                        ? 'bg-blue-900/20 text-blue-400 font-medium'
                        : 'text-gray-300 hover:bg-gray-700'
                    )}
                    title={!isHovered ? item.label : undefined}
                  >
                    <Icon className="h-8 w-8 flex-shrink-0" />
                    <span className={cn(
                      "transition-all duration-300 whitespace-nowrap",
                      isHovered ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </aside>
  )
}