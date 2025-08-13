'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Heart, Download, Share2, Flag, Eye, Calendar, Tag, DollarSign } from 'lucide-react'
import { mockModels } from '@/lib/mockData'
import { Model } from '@/types'
import { formatNumber, formatDate, formatFileSize } from '@/lib/utils'
import ModelCard from '@/components/ui/ModelCard'
import { useStore } from '@/store/useStore'

// 3Dビューアを動的インポート（SSR無効化）
const ModelViewer = dynamic(() => import('@/components/3d/ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">3Dビューアを読み込み中...</p>
      </div>
    </div>
  ),
})

export default function ViewPage() {
  const params = useParams()
  const [model, setModel] = useState<Model | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [relatedModels, setRelatedModels] = useState<Model[]>([])
  const [activeTab, setActiveTab] = useState('description')
  const storedModels = useStore((state) => state.models)

  useEffect(() => {
    // storeとモックデータから該当モデルを取得
    const allModels = [...storedModels, ...mockModels]
    const foundModel = allModels.find(m => m.id === params.id)
    if (foundModel) {
      setModel(foundModel)
      // 関連モデルを取得（同じユーザーの他の作品）
      setRelatedModels(allModels.filter(m => m.userId === foundModel.userId && m.id !== foundModel.id))
    }
  }, [params.id, storedModels])

  if (!model) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">モデルが見つかりません</p>
        </div>
      </div>
    )
  }

  const handleDownload = () => {
    if (model.isFree) {
      // 無料ダウンロード処理
      window.open(model.fileUrl, '_blank')
    } else {
      // 有料ダウンロード処理（Stripe決済へ）
      alert('決済機能は準備中です')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 3Dビューア */}
      <div className="h-[60vh] bg-gray-900">
        <ModelViewer 
          modelUrl={model.fileUrl === 'threejs-code' || model.fileUrl === 'threejs-html' ? undefined : model.fileUrl}
          code={model.metadata?.code as string | undefined}
          htmlContent={model.metadata?.htmlContent as string | undefined}
          modelType={
            model.metadata?.type === 'threejs-code' ? 'code' : 
            model.metadata?.type === 'threejs-html' ? 'html' : 
            'file'
          }
          showCodeEditor={model.metadata?.type === 'threejs-code'}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2">
            {/* タイトルとアクション */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{model.title}</h1>
              
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Eye className="h-4 w-4" />
                  <span>{formatNumber(model.viewCount)} 回視聴</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(model.createdAt)}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                    isLiked
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{formatNumber(model.likeCount + (isLiked ? 1 : 0))}</span>
                </button>
                
                <button className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200">
                  <Share2 className="h-5 w-5" />
                  <span>共有</span>
                </button>
                
                <button className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200">
                  <Flag className="h-5 w-5" />
                  <span>報告</span>
                </button>
              </div>
            </div>

            {/* タブコンテンツ */}
            <div className="rounded-lg bg-white p-6">
              <div className="mb-4 flex gap-4 border-b">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-2 font-medium ${
                    activeTab === 'description'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  説明
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 font-medium ${
                    activeTab === 'specs'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  スペック
                </button>
                <button
                  onClick={() => setActiveTab('license')}
                  className={`pb-2 font-medium ${
                    activeTab === 'license'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ライセンス
                </button>
              </div>

              {activeTab === 'description' && (
                <div>
                  <p className="whitespace-pre-wrap text-gray-700">
                    {model.description || 'このモデルの説明はありません。'}
                  </p>
                  
                  {model.tags.length > 0 && (
                    <div className="mt-6">
                      <div className="flex flex-wrap gap-2">
                        {model.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/search?tag=${encodeURIComponent(tag)}`}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                          >
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">ポリゴン数</span>
                    <span className="font-medium">
                      {model.polygonCount ? formatNumber(model.polygonCount) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">ファイルサイズ</span>
                    <span className="font-medium">
                      {model.fileSize ? formatFileSize(model.fileSize) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">アニメーション</span>
                    <span className="font-medium">
                      {model.hasAnimation ? `あり (${model.animationDuration}秒)` : 'なし'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">フォーマット</span>
                    <span className="font-medium">GLB/GLTF</span>
                  </div>
                </div>
              )}

              {activeTab === 'license' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <h3 className="font-semibold text-blue-900">{model.licenseType}</h3>
                    <p className="mt-2 text-sm text-blue-700">
                      このモデルは{model.licenseType}ライセンスで提供されています。
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-5 w-5 rounded-full ${model.isCommercialOk ? 'bg-green-500' : 'bg-red-500'}`}>
                        <svg className="h-5 w-5 text-white p-1" fill="currentColor" viewBox="0 0 20 20">
                          {model.isCommercialOk ? (
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          )}
                        </svg>
                      </span>
                      <span className="text-sm">
                        商用利用: {model.isCommercialOk ? '可能' : '不可'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 作者情報 */}
            <div className="rounded-lg bg-white p-6">
              <h3 className="mb-4 font-semibold">作者</h3>
              {model.user && (
                <Link href={`/user/${model.user.username}`} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                    {model.user.avatarUrl ? (
                      <img
                        src={model.user.avatarUrl}
                        alt={model.user.username}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full text-white">
                        {model.user.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium hover:text-blue-600">{model.user.displayName || model.user.username}</p>
                    <p className="text-sm text-gray-600">
                      {formatNumber(model.user.followerCount)} フォロワー
                    </p>
                  </div>
                </Link>
              )}
              
              <button className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700">
                フォロー
              </button>
            </div>

            {/* ダウンロード */}
            <div className="rounded-lg bg-white p-6">
              <h3 className="mb-4 font-semibold">ダウンロード</h3>
              
              {model.isFree ? (
                <button
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700"
                >
                  <Download className="h-5 w-5" />
                  無料ダウンロード
                </button>
              ) : (
                <div>
                  <div className="mb-4 text-center">
                    <span className="text-3xl font-bold">¥{model.price.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
                  >
                    <DollarSign className="h-5 w-5" />
                    購入してダウンロード
                  </button>
                </div>
              )}
              
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>{formatNumber(model.downloadCount)} ダウンロード</span>
                </div>
              </div>
            </div>

            {/* 投げ銭 */}
            <div className="rounded-lg bg-white p-6">
              <h3 className="mb-4 font-semibold">クリエイターを応援</h3>
              <button className="w-full rounded-lg border border-gray-300 py-2 font-medium hover:bg-gray-50">
                投げ銭する
              </button>
            </div>
          </div>
        </div>

        {/* 関連作品 */}
        {relatedModels.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">同じ作者の他の作品</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedModels.slice(0, 4).map((model) => (
                <ModelCard key={model.id} model={model} showUser={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}