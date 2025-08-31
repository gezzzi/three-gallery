'use client'

import Link from 'next/link'

export default function PageFooter() {
  return (
    <footer className="mt-auto border-t border-gray-700 bg-gray-800 pb-16 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          {/* リンク */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/about" className="hover:text-gray-200 transition-colors">
              運営者
            </Link>
            <Link href="/terms" className="hover:text-gray-200 transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="hover:text-gray-200 transition-colors">
              プライバシー
            </Link>
          </div>
          
          {/* コピーライト */}
          <div className="text-sm text-gray-400">
            © 2025 ThreeGallery
          </div>
        </div>
      </div>
    </footer>
  )
}