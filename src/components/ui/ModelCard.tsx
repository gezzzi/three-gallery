'use client'

import Link from 'next/link'
import { Heart, Download, Eye, Tag, Code } from 'lucide-react'
import { Model } from '@/types'
import { formatNumber, formatDate } from '@/lib/utils'
import { useState } from 'react'

interface ModelCardProps {
  model: Model
  showUser?: boolean
}

export default function ModelCard({ model, showUser = true }: ModelCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLiked(!isLiked)
  }

  return (
    <Link href={`/view/${model.id}`}>
      <div className="group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-lg">
        {/* サムネイル */}
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {model.thumbnailUrl && !imageError ? (
            <img
              src={model.thumbnailUrl}
              alt={model.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <div className="text-gray-500">
                {model.modelType === 'code' ? (
                  <Code className="h-12 w-12" />
                ) : (
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>
            </div>
          )}
          
          {/* バッジ */}
          {model.modelType === 'code' ? (
            <div className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white">
              Three.jsコード
            </div>
          ) : model.hasAnimation ? (
            <div className="absolute left-2 top-2 rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white">
              アニメーション
            </div>
          ) : null}
          
          {/* 価格バッジ */}
          <div className="absolute right-2 top-2">
            {model.isFree ? (
              <div className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white">
                無料
              </div>
            ) : (
              <div className="rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white">
                ¥{model.price.toLocaleString()}
              </div>
            )}
          </div>

          {/* ホバー時のアクション */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleLike}
              className="rounded-full bg-white p-3 shadow-lg transition-transform hover:scale-110"
              aria-label="いいね"
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
            </button>
          </div>
        </div>

        {/* 情報 */}
        <div className="p-3">
          <h3 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-blue-600">
            {model.title}
          </h3>
          
          {showUser && model.user && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-gray-300">
                {model.user.avatarUrl ? (
                  <img
                    src={model.user.avatarUrl}
                    alt={model.user.username}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs text-white">
                    {model.user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600">{model.user.username}</span>
            </div>
          )}

          {/* タグ */}
          {model.tags.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <Tag className="h-3 w-3 text-gray-400" />
              <div className="flex gap-1 overflow-hidden">
                {model.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-gray-500">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 統計 */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{formatNumber(model.viewCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{formatNumber(model.likeCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{formatNumber(model.downloadCount)}</span>
            </div>
          </div>

          <div className="mt-1 text-xs text-gray-400">
            {formatDate(model.createdAt)}
          </div>
        </div>
      </div>
    </Link>
  )
}