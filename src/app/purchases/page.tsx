'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ShoppingBag, Download, LogIn, Loader2, Package } from 'lucide-react'
import ModelCard from '@/components/ui/ModelCard'
import { Model } from '@/types'
import { useStore } from '@/store/useStore'
import dynamic from 'next/dynamic'

const AuthModal = dynamic(() => import('@/components/ui/AuthModal'), { ssr: false })

export default function PurchasesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [purchasedModelsData, setPurchasedModelsData] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { purchasedModels, models: storedModels } = useStore()

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchPurchasedModels()
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading, purchasedModels])

  const fetchPurchasedModels = async () => {
    setLoading(true)
    try {
      // ローカルストアから、購入済みモデルを取得
      const allModels = [...storedModels]
      const uniqueModels = Array.from(
        new Map(allModels.map(model => [model.id, model])).values()
      )
      
      // 購入済みモデルのみをフィルタリング
      const purchased = uniqueModels.filter(model => 
        purchasedModels.includes(model.id)
      )
      
      // 購入日時順にソート（デモのため作成日でソート）
      purchased.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      setPurchasedModelsData(purchased)
    } catch (error) {
      console.error('Error fetching purchased models:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (model: Model) => {
    // ダウンロード処理（実際の実装では適切なダウンロード処理を行う）
    console.log('Downloading model:', model.title)
    alert(`${model.title} のダウンロードを開始します`)
  }

  // ローディング中
  if (authLoading || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未ログイン
  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center max-w-md">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">
            購入済み商品を表示するにはログインが必要です
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            <div className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              ログイン / 新規登録
            </div>
          </button>
        </div>
        
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-green-600" />
          購入済み商品
        </h1>
        <p className="mt-2 text-gray-600">
          購入した3Dモデルとコンテンツ
        </p>
      </div>

      {/* 購入統計 */}
      {purchasedModelsData.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">購入数</p>
                <p className="text-3xl font-bold mt-1">{purchasedModelsData.length}</p>
              </div>
              <Package className="h-8 w-8 opacity-50" />
            </div>
          </div>
          
          <div className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">ダウンロード済み</p>
                <p className="text-3xl font-bold mt-1">
                  {purchasedModelsData.length}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 opacity-50" />
            </div>
          </div>
          
          <div className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">ダウンロード可能</p>
                <p className="text-3xl font-bold mt-1">{purchasedModelsData.length}</p>
              </div>
              <Download className="h-8 w-8 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* 購入済み一覧 */}
      {purchasedModelsData.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">購入済みアイテム</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {purchasedModelsData.map((model) => (
              <div key={model.id} className="relative">
                <ModelCard model={model} />
                {/* ダウンロードボタンオーバーレイ */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => handleDownload(model)}
                    className="rounded-lg bg-green-600 p-2 text-white shadow-lg hover:bg-green-700 transition-colors"
                    title="ダウンロード"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-2">
            購入済み商品がまだありません
          </p>
          <p className="text-gray-400 mb-6">
            有料の3Dモデルを購入すると、ここに表示されます
          </p>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
          >
            モデルを探す
          </button>
        </div>
      )}

      {/* 購入履歴の説明 */}
      <div className="mt-12 rounded-lg bg-gray-50 p-6">
        <h3 className="text-lg font-semibold mb-3">購入済み商品について</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>購入した商品は永続的にダウンロード可能です</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>商用利用可能な商品は、ライセンスに従って使用できます</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>購入履歴は自動的に保存されます</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>ダウンロード回数に制限はありません</span>
          </li>
        </ul>
      </div>
    </div>
  )
}