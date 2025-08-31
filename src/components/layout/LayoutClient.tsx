'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import PageFooter from './PageFooter'

interface LayoutClientProps {
  children: ReactNode
}

export default function LayoutClient({ children }: LayoutClientProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <div className="flex relative flex-1">
        <Sidebar />
        <main className="flex-1 md:ml-16 pb-16 md:pb-0 transition-all duration-300">
          {children}
        </main>
      </div>
      <PageFooter />
      <Footer />
    </div>
  )
}