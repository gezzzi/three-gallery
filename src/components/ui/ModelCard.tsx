'use client'

import Link from 'next/link'
import { Download, Eye, Tag, Code, Heart } from 'lucide-react'
import { Model } from '@/types'
import { formatNumber, formatDate } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { useLike } from '@/hooks/useLike'

interface ModelCardProps {
  model: Model
  showUser?: boolean
}

// グローバル変数で現在再生中のカードを管理
let currentlyPlayingCard: string | null = null
let setCurrentlyPlayingCardGlobal: ((id: string | null) => void) | null = null

export default function ModelCard({ model, showUser = true }: ModelCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  const { likeCount } = useLike(model.id)

  // グローバルな再生状態管理
  useEffect(() => {
    setCurrentlyPlayingCardGlobal = (id: string | null) => {
      if (id !== model.id && isPlaying) {
        setIsPlaying(false)
        setShowPreview(false)
      }
    }
  }, [model.id, isPlaying])

  // モバイルデバイスの検出
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // IntersectionObserver for mobile viewport center detection
  useEffect(() => {
    if (!isMobile || !cardRef.current) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 画面の中央付近にある場合（50%以上表示されている）
          if (entry.intersectionRatio > 0.5) {
            setIsInView(true)
          } else {
            setIsInView(false)
            if (isPlaying) {
              setIsPlaying(false)
              setShowPreview(false)
            }
          }
        })
      },
      {
        threshold: [0, 0.5, 1.0],
        rootMargin: '-25% 0px -25% 0px' // 上下25%を除外して中央部分のみ検出
      }
    )

    observerRef.current.observe(cardRef.current)

    return () => {
      if (observerRef.current && cardRef.current) {
        observerRef.current.unobserve(cardRef.current)
      }
    }
  }, [isMobile, isPlaying])

  // モバイルで中央に来たら自動再生
  useEffect(() => {
    if (isMobile && isInView && model.uploadType === 'html' && !isPlaying) {
      handleStartPreview()
    }
  }, [isMobile, isInView, model.uploadType])

  const handleStartPreview = () => {
    console.log('[ModelCard] handleStartPreview called for:', model.title)
    console.log('[ModelCard] uploadType:', model.uploadType)
    console.log('[ModelCard] has metadata:', !!model.metadata)
    console.log('[ModelCard] has htmlContent:', !!model.metadata?.htmlContent)
    
    if (!model.metadata?.htmlContent) {
      console.log('[ModelCard] Preview blocked - no HTML content')
      return
    }
    
    // 他の再生中のカードを停止
    if (currentlyPlayingCard && currentlyPlayingCard !== model.id) {
      setCurrentlyPlayingCardGlobal?.(null)
    }
    
    currentlyPlayingCard = model.id
    setIsPlaying(true)
    setShowPreview(true)
    console.log('[ModelCard] Preview started!')
  }

  const handleStopPreview = () => {
    if (currentlyPlayingCard === model.id) {
      currentlyPlayingCard = null
    }
    setIsPlaying(false)
    setShowPreview(false)
  }

  const handleMouseEnter = () => {
    if (!isMobile && model.uploadType === 'html') {
      handleStartPreview()
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      handleStopPreview()
    }
  }


  // HTMLコンテンツの取得
  const getHtmlContent = () => {
    if (model.metadata?.htmlContent) {
      return model.metadata.htmlContent as string
    }
    return null
  }

  return (
    <Link href={`/view/${model.id}`}>
      <div 
        ref={cardRef}
        className="group relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800 transition-all hover:shadow-lg"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* サムネイル/プレビュー */}
        <div className="relative aspect-video overflow-hidden bg-gray-800">
          {showPreview && getHtmlContent() ? (
            <iframe
              ref={iframeRef}
              srcDoc={getHtmlContent()!}
              className="h-full w-full border-0"
              sandbox="allow-scripts"
              style={{ pointerEvents: 'none' }}
              title={`Preview of ${model.title}`}
            />
          ) : model.thumbnailUrl && model.thumbnailUrl !== '' && !imageError ? (
            <img
              src={model.thumbnailUrl}
              alt={model.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                setImageError(true)
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-600">
              <div className="text-gray-400">
                {model.uploadType === 'code' ? (
                  <Code className="h-12 w-12" />
                ) : model.uploadType === 'html' ? (
                  <div className="text-center">
                    <Code className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-xs">HTML/Three.js</p>
                  </div>
                ) : (
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>
            </div>
          )}
          

        </div>

        {/* 情報 */}
        <div className="p-3">
          <h3 className="line-clamp-1 font-semibold text-gray-100 group-hover:text-blue-400">
            {model.title}
          </h3>
          
          {showUser && model.user && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-gray-600">
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
              <span className="text-sm text-gray-400">{model.user.username}</span>
            </div>
          )}

          {/* タグ */}
          {model.tags.length > 0 && (
            <div className="mt-2 flex items-center gap-1">
              <Tag className="h-3 w-3 text-gray-400" />
              <div className="flex gap-1 overflow-hidden">
                {model.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-gray-400">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 統計 */}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{formatNumber(model.viewCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{formatNumber(likeCount || model.likeCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{formatNumber(model.downloadCount)}</span>
            </div>
          </div>

          <div className="mt-1 text-xs text-gray-500">
            {formatDate(model.createdAt)}
          </div>
        </div>
      </div>
    </Link>
  )
}