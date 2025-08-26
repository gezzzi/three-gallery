'use client'

import { ReactNode, useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

interface LayoutClientProps {
  children: ReactNode
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const { isSidebarOpen } = useStore()
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // モバイル判定と画面サイズ監視
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
    <>
      <Header />
      <div className="flex relative">
        <Sidebar />
        <main className={cn(
          "flex-1 min-h-[calc(100vh-64px)] bg-gray-900 transition-all duration-300",
          // デスクトップではサイドバーの開閉に応じてマージンを調整
          !isMobile && sidebarState ? "lg:ml-64" : "ml-0",
          // モバイルでは常にフルwidth
          "w-full"
        )}>
          {/* モバイルでサイドバーが開いている時のオーバーレイ */}
          {isMobile && sidebarState && (
            <div 
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => useStore.getState().toggleSidebar()}
            />
          )}
          {children}
        </main>
      </div>
    </>
  )
}