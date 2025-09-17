'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Footer() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const menuItems = [
    { icon: Home, label: t.nav.home, href: '/' },
    { icon: Upload, label: t.nav.upload, href: '/upload' },
    { icon: Users, label: t.nav.following, href: '/following' },
  ]

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-700 bg-gray-800">
      <nav className="flex items-center justify-center px-2 py-2">
        <div className="flex items-center justify-around w-full max-w-md">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0',
                isActive
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              )}
            >
              <Icon className={cn(
                "h-5 w-5",
                isActive && "fill-current"
              )} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
        </div>
      </nav>
    </footer>
  )
}