import Link from 'next/link'
import { FileQuestion, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <FileQuestion className="mx-auto h-24 w-24 text-gray-400" />
        </div>
        
        <h1 className="mb-2 text-4xl font-bold text-gray-900">
          404
        </h1>
        
        <h2 className="mb-4 text-xl font-semibold text-gray-700">
          ページが見つかりません
        </h2>
        
        <p className="mb-8 text-gray-600">
          お探しのページは存在しないか、移動した可能性があります。
          URLをご確認の上、もう一度お試しください。
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            ホームに戻る
          </Link>
          
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Search className="h-4 w-4" />
            検索する
          </Link>
        </div>

        <div className="mt-12 border-t pt-8">
          <h3 className="mb-4 text-sm font-semibold text-gray-600">
            人気のページ
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/upload"
              className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              アップロード
            </Link>
            <Link
              href="/library"
              className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              ライブラリ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}