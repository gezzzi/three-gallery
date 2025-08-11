'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

interface LayoutClientProps {
  children: ReactNode
}

export default function LayoutClient({ children }: LayoutClientProps) {
  const { isSidebarOpen } = useStore()

  return (
    <>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={cn(
          "flex-1 min-h-[calc(100vh-64px)] bg-gray-50 transition-all duration-300",
          isSidebarOpen ? "ml-64" : "ml-0"
        )}>
          {children}
        </main>
      </div>
    </>
  )
}