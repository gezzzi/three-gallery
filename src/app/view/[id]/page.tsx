'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Heart, Download, Share2, Flag, Eye, Calendar, Tag, Bookmark } from 'lucide-react'
import { mockModels } from '@/lib/mockData'
import { Model } from '@/types'
import { formatNumber, formatDate, formatFileSize } from '@/lib/utils'
import ModelCard from '@/components/ui/ModelCard'
import { useStore } from '@/store/useStore'
import { useBookmark } from '@/hooks/useBookmark'
import { useLike } from '@/hooks/useLike'
import { getDefaultBGM } from '@/lib/defaultBgm'
import { supabase } from '@/lib/supabase'

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

// 音楽プレイヤーを動的インポート
const MusicPlayer = dynamic(() => import('@/components/ui/MusicPlayer'), {
  ssr: false,
})

export default function ViewPage() {
  const params = useParams()
  const [model, setModel] = useState<Model | null>(null)
  const [relatedModels, setRelatedModels] = useState<Model[]>([])
  const [activeTab, setActiveTab] = useState('description')
  const [musicUrl, setMusicUrl] = useState<string | undefined>()
  const [musicName, setMusicName] = useState<string>('無題の曲')
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const storedModels = useStore((state) => state.models)
  const addToHistory = useStore((state) => state.addToHistory)
  const { isBookmarked, toggleBookmark } = useBookmark(params.id as string)
  const { isLiked, toggleLike, likeCount } = useLike(params.id as string)

  useEffect(() => {
    const fetchModel = async () => {
      // Supabaseからモデルを取得
      const { data: supabaseModel, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', params.id)
        .single()
      
      let foundModel: Model | null = null
      
      if (!error && supabaseModel) {
        // SupabaseのデータをModel形式に変換
        foundModel = {
          id: supabaseModel.id,
          userId: supabaseModel.user_id,
          title: supabaseModel.title,
          description: supabaseModel.description || '',
          thumbnailUrl: supabaseModel.thumbnail_url || '/placeholder-3d.svg',
          fileUrl: supabaseModel.file_url,
          previewUrl: supabaseModel.preview_url,
          originalFileUrl: supabaseModel.original_file_url,
          metadata: supabaseModel.metadata || {},
          tags: supabaseModel.tags || [],
          viewCount: supabaseModel.view_count || 0,
          downloadCount: supabaseModel.download_count || 0,
          likeCount: supabaseModel.like_count || 0,
          createdAt: supabaseModel.created_at,
          updatedAt: supabaseModel.updated_at || supabaseModel.created_at,
          status: supabaseModel.status || 'public',
          licenseType: supabaseModel.license_type || 'CC BY',
          isCommercialOk: supabaseModel.is_commercial_ok || false,
          fileSize: supabaseModel.file_size || 0,
          hasAnimation: supabaseModel.has_animation || false,
          polygonCount: supabaseModel.polygon_count,
          animationDuration: supabaseModel.animation_duration,
          // BGMデータ
          musicType: supabaseModel.bgm_type || (supabaseModel.metadata?.music_type as string) || undefined,
          musicUrl: supabaseModel.bgm_url || (supabaseModel.metadata?.music_url as string) || undefined,
          musicName: supabaseModel.bgm_name || (supabaseModel.metadata?.music_name as string) || undefined
        }
      } else {
        // Supabaseから取得できない場合はローカルデータを使用
        const allModels = [...storedModels, ...mockModels]
        foundModel = allModels.find(m => m.id === params.id) || null
      }
      
      if (foundModel) {
        setModel(foundModel)
        // 関連モデルを取得
        const { data: relatedData } = await supabase
          .from('models')
          .select('*')
          .eq('user_id', foundModel.userId)
          .neq('id', foundModel.id)
          .limit(6)
        
        if (relatedData) {
          const formattedRelated = relatedData.map(model => ({
            id: model.id,
            userId: model.user_id,
            title: model.title,
            description: model.description || '',
            thumbnailUrl: model.thumbnail_url || '/placeholder-3d.svg',
            fileUrl: model.file_url,
            previewUrl: model.preview_url,
            originalFileUrl: model.original_file_url,
            metadata: model.metadata || {},
            tags: model.tags || [],
            viewCount: model.view_count || 0,
            downloadCount: model.download_count || 0,
            likeCount: model.like_count || 0,
            createdAt: model.created_at,
            updatedAt: model.updated_at || model.created_at,
            status: model.status || 'public',
            licenseType: model.license_type || 'CC BY',
            isCommercialOk: model.is_commercial_ok || false,
            fileSize: model.file_size || 0,
            hasAnimation: model.has_animation || false,
            polygonCount: model.polygon_count,
            animationDuration: model.animation_duration
          })) as Model[]
          setRelatedModels(formattedRelated)
        }
        
        // 閲覧履歴に追加
        addToHistory(foundModel.id)
        
        // 音楽のURLを設定
        const metadata = foundModel.metadata as Record<string, unknown>
        
        // 音楽のURLを設定
        console.log('[ViewPage] BGMデータを確認:', {
          musicType: foundModel.musicType,
          musicUrl: foundModel.musicUrl,
          musicName: foundModel.musicName,
          bgm_type: supabaseModel?.bgm_type,
          bgm_url: supabaseModel?.bgm_url,
          bgm_name: supabaseModel?.bgm_name,
          metadata: metadata,
          music_id: metadata?.music_id,
          music_type: metadata?.music_type,
          music_url: metadata?.music_url
        })
        
        // BGMカラムから直接取得（優先）
        if (foundModel.musicType === 'default') {
          // metadataにmusicl_idがある場合
          if (metadata?.music_id) {
            const bgm = getDefaultBGM(metadata.music_id as string)
            console.log('[ViewPage] デフォルトBGMを取得 (music_id):', bgm)
            if (bgm) {
              setMusicUrl(bgm.url)
              setMusicName(bgm.name)
            }
          }
          // bgm_urlが直接保存されている場合
          else if (foundModel.musicUrl) {
            console.log('[ViewPage] BGM URLが直接保存されています:', foundModel.musicUrl)
            setMusicUrl(foundModel.musicUrl)
            setMusicName(foundModel.musicName || 'デフォルトBGM')
          }
        } else if (foundModel.musicType === 'upload' && foundModel.musicUrl) {
          console.log('[ViewPage] アップロードBGM:', foundModel.musicUrl)
          setMusicUrl(foundModel.musicUrl)
          setMusicName(foundModel.musicName || 'アップロードされたBGM')
        }
        // metadataから取得（互換性のため）
        else if (metadata?.music_type === 'default') {
          if (metadata?.music_id) {
            const bgm = getDefaultBGM(metadata.music_id as string)
            console.log('[ViewPage] デフォルトBGMを取得 (metadata.music_id):', bgm)
            if (bgm) {
              setMusicUrl(bgm.url)
              setMusicName(bgm.name)
            }
          } else if (metadata?.music_url) {
            console.log('[ViewPage] BGM URLがmetadataに保存されています:', metadata.music_url)
            setMusicUrl(metadata.music_url as string)
            setMusicName((metadata.music_name as string) || 'デフォルトBGM')
          }
        } else if (metadata?.music_type === 'upload' && metadata?.music_url) {
          console.log('[ViewPage] アップロードBGM (metadata):', metadata.music_url)
          setMusicUrl(metadata.music_url as string)
          setMusicName((metadata.music_name as string) || 'アップロードされたBGM')
        }
        
        // 最終的な音楽設定の確認（この時点ではstateはまだ更新されていない）
      }
    }
    
    fetchModel()
  }, [params.id])

  // ページ遷移時に前の音楽を停止
  useEffect(() => {
    return () => {
      // このページを離れる時に音楽を停止
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [params.id])

  // 音楽URLが設定されたことを確認
  useEffect(() => {
    console.log('[ViewPage] 音楽URLが更新されました:', { musicUrl, musicName })
  }, [musicUrl, musicName])

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
    // ダウンロード処理
    window.open(model.fileUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 3Dビューア */}
      <div className="h-[60vh] bg-gray-900 relative">
        <ModelViewer 
          modelUrl={model.fileUrl === 'threejs-html' ? undefined : model.fileUrl}
          htmlContent={model.metadata?.htmlContent as string | undefined}
          modelType={
            model.metadata?.type === 'threejs-html' ? 'html' : 
            'file'
          }
        />
        
        {/* 音楽プレイヤー */}
        {musicUrl && (
          <div className="absolute bottom-4 right-4 z-20">
            <MusicPlayer
              musicUrl={musicUrl}
              musicName={musicName}
              autoPlay={false}
              onPlay={() => {
                // onPlayコールバックは一旦無効化（他の音楽停止機能は後で実装）
                console.log('[ViewPage] 音楽が再生されました')
              }}
            />
          </div>
        )}
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
                  onClick={toggleLike}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                    isLiked
                      ? 'bg-red-50 text-red-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{formatNumber(likeCount || model.likeCount)}</span>
                </button>
                
                <button
                  onClick={toggleBookmark}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                    isBookmarked
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span>ブックマーク</span>
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
              
              <button
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700"
              >
                <Download className="h-5 w-5" />
                ダウンロード
              </button>
              
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