'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertCircle } from 'lucide-react'

export default function ClearLocalPage() {
  const router = useRouter()
  const [cleared, setCleared] = useState(false)
  const [modelsCount, setModelsCount] = useState(0)

  useEffect(() => {
    // 現在のローカルモデル数を取得
    const storeKey = 'three-gallery-store'
    const storedData = localStorage.getItem(storeKey)
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        if (parsedData.state && parsedData.state.models) {
          setModelsCount(parsedData.state.models.length)
        }
      } catch (error) {
        console.error('Failed to parse localStorage:', error)
      }
    }
  }, [])

  const clearLocalModels = () => {
    const storeKey = 'three-gallery-store'
    const storedData = localStorage.getItem(storeKey)
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        
        // modelsを空配列にリセット
        if (parsedData.state && parsedData.state.models) {
          parsedData.state.models = []
          
          // 更新したデータを保存
          localStorage.setItem(storeKey, JSON.stringify(parsedData))
          setCleared(true)
          setModelsCount(0)
          
          // 2秒後にホームページにリダイレクト
          setTimeout(() => {
            router.push('/')
          }, 2000)
        }
      } catch (error) {
        console.error('Failed to clear localStorage:', error)
        alert('ローカルデータのクリアに失敗しました')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Trash2 className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold">ローカルモデルの削除</h1>
          </div>

          <div className="mb-6 rounded-lg bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">注意</p>
                <p className="mt-1 text-sm text-yellow-700">
                  この操作はローカルストレージに保存されたモデルデータを削除します。
                  Supabaseに保存されたデータとデモ作品は削除されません。
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">
              現在のローカルモデル数: <span className="font-bold text-gray-900">{modelsCount}</span> 件
            </p>
          </div>

          {!cleared ? (
            <div className="flex gap-4">
              <button
                onClick={clearLocalModels}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
                disabled={modelsCount === 0}
              >
                <Trash2 className="h-4 w-4" />
                ローカルモデルを削除
              </button>
              <button
                onClick={() => router.push('/')}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-green-700">
                ✓ ローカルモデルを削除しました。ホームページにリダイレクトします...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}