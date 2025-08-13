'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="ja">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <AlertTriangle className="mx-auto h-20 w-20 text-red-500" />
            </div>
            
            <h1 className="mb-4 text-3xl font-bold text-gray-900">
              システムエラー
            </h1>
            
            <p className="mb-8 text-gray-600">
              重大なエラーが発生しました。
              ページを再読み込みしてください。
            </p>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-left">
                <p className="text-sm font-mono text-red-800">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="mt-2 text-xs text-red-600">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-8 py-3 font-medium text-white hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              ページを再読み込み
            </button>

            <div className="mt-8 text-sm text-gray-500">
              問題が解決しない場合は、ブラウザのキャッシュをクリアしてから
              もう一度お試しください。
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}