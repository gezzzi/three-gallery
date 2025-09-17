'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Heart, Share2, Eye, Calendar, Tag, Maximize, Edit } from 'lucide-react'
import { Model } from '@/types'
import { formatNumber, formatDate, formatFileSize } from '@/lib/utils'
import ModelCard from '@/components/ui/ModelCard'
import FollowButton from '@/components/ui/FollowButton'
import { useStore } from '@/store/useStore'
import { useLike } from '@/hooks/useLike'
import { useViewCount } from '@/hooks/useViewCount'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { getDefaultBGM } from '@/lib/defaultBgm'
import { supabase } from '@/lib/supabase'

// Dynamically import HTML viewer (disable SSR)
const HtmlPreview = dynamic(() => import('@/components/3d/HtmlPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-800">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-blue-600 mx-auto" />
        <p className="mt-4 text-gray-400">Loading viewer...</p>
      </div>
    </div>
  ),
})

// Dynamically import music player
const MusicPlayer = dynamic(() => import('@/components/ui/MusicPlayer'), {
  ssr: false,
})

// Dynamically import share modal
const ShareModal = dynamic(() => import('@/components/ui/ShareModal').then(mod => ({ default: mod.ShareModal })), {
  ssr: false,
})

export default function ViewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [model, setModel] = useState<Model | null>(null)
  const [relatedModels, setRelatedModels] = useState<Model[]>([])
  const [activeTab, setActiveTab] = useState('description')
  const [musicUrl, setMusicUrl] = useState<string | undefined>()
  const [musicName, setMusicName] = useState<string>('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const viewerContainerRef = useRef<HTMLDivElement>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const storedModels = useStore((state) => state.models)
  const addToHistory = useStore((state) => state.addToHistory)
  const { isLiked, toggleLike, likeCount } = useLike(params.id as string)
  const { viewCount } = useViewCount(model?.id, model?.viewCount || 0)

  useEffect(() => {
    const fetchModel = async () => {
      // Fetch model from Supabase (including user information)
      console.log('[ViewPage] Fetching model with id:', params.id)
      const { data: supabaseModel, error } = await supabase
        .from('models')
        .select(`
          *,
          user:profiles!user_id(
            id,
            username,
            display_name,
            avatar_url,
            bio,
            follower_count
          )
        `)
        .eq('id', params.id)
        .single()
      
      console.log('[ViewPage] Supabase query result:', { supabaseModel, error })
      
      let foundModel: Model | null = null
      
      if (!error && supabaseModel) {
        // Debug log
        console.log('[ViewPage] Fetched model with user:', {
          modelId: supabaseModel.id,
          userId: supabaseModel.user_id,
          user: supabaseModel.user
        })
        
        // Convert Supabase data to Model format
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
          likeCount: supabaseModel.like_count || 0,
          createdAt: supabaseModel.created_at,
          updatedAt: supabaseModel.updated_at || supabaseModel.created_at,
          status: supabaseModel.status || 'public',
          licenseType: supabaseModel.license_type || 'CC BY',
          isCommercialOk: supabaseModel.is_commercial_ok || false,
          fileSize: supabaseModel.file_size || 0,
          // BGM data
          musicType: supabaseModel.bgm_type || (supabaseModel.metadata?.music_type as string) || undefined,
          musicUrl: supabaseModel.bgm_url || (supabaseModel.metadata?.music_url as string) || undefined,
          musicName: supabaseModel.bgm_name || (supabaseModel.metadata?.music_name as string) || undefined,
          // Add user information
          user: supabaseModel.user ? {
            id: supabaseModel.user.id,
            username: supabaseModel.user.username,
            displayName: supabaseModel.user.display_name,
            avatarUrl: supabaseModel.user.avatar_url,
            bio: supabaseModel.user.bio,
            followerCount: supabaseModel.user.follower_count || 0,
            isPremium: false,
            followingCount: 0,
            createdAt: new Date().toISOString()
          } : undefined
        }
      } else {
        // Use local data if cannot fetch from Supabase
        const allModels = [...storedModels]
        foundModel = allModels.find(m => m.id === params.id) || null
      }
      
      if (foundModel) {
        setModel(foundModel)
        // Get related models
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
            likeCount: model.like_count || 0,
            createdAt: model.created_at,
            updatedAt: model.updated_at || model.created_at,
            status: model.status || 'public',
            licenseType: model.license_type || 'CC BY',
            isCommercialOk: model.is_commercial_ok || false,
            fileSize: model.file_size || 0
          })) as Model[]
          setRelatedModels(formattedRelated)
        }
        
        // Add to browsing history
        addToHistory(foundModel.id)
        
        // Set music URL
        const metadata = foundModel.metadata as Record<string, unknown>
        
        // Set music URL
        console.log('[ViewPage] Checking BGM data:', {
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
        
        // Get directly from BGM columns (priority)
        if (foundModel.musicType === 'default') {
          // If metadata has music_id
          if (metadata?.music_id) {
            const bgm = getDefaultBGM(metadata.music_id as string)
            console.log('[ViewPage] Getting default BGM (music_id):', bgm)
            if (bgm) {
              setMusicUrl(bgm.url)
              setMusicName(bgm.name)
            }
          }
          // If bgm_url is directly saved
          else if (foundModel.musicUrl) {
            console.log('[ViewPage] BGM URL is directly saved:', foundModel.musicUrl)
            setMusicUrl(foundModel.musicUrl)
            setMusicName(foundModel.musicName || t.upload.selectFromDefault)
          }
        } else if (foundModel.musicType === 'upload' && foundModel.musicUrl) {
          console.log('[ViewPage] Upload BGM:', foundModel.musicUrl)
          setMusicUrl(foundModel.musicUrl)
          setMusicName(foundModel.musicName || t.upload.uploadCustom)
        }
        // Get from metadata (for compatibility)
        else if (metadata?.music_type === 'default') {
          if (metadata?.music_id) {
            const bgm = getDefaultBGM(metadata.music_id as string)
            console.log('[ViewPage] Getting default BGM (metadata.music_id):', bgm)
            if (bgm) {
              setMusicUrl(bgm.url)
              setMusicName(bgm.name)
            }
          } else if (metadata?.music_url) {
            console.log('[ViewPage] BGM URL is saved in metadata:', metadata.music_url)
            setMusicUrl(metadata.music_url as string)
            setMusicName((metadata.music_name as string) || t.upload.selectFromDefault)
          }
        } else if (metadata?.music_type === 'upload' && metadata?.music_url) {
          console.log('[ViewPage] Upload BGM (metadata):', metadata.music_url)
          setMusicUrl(metadata.music_url as string)
          setMusicName((metadata.music_name as string) || t.upload.uploadCustom)
        }
        
        // Final music configuration check (state not yet updated at this point)
      }
    }
    
    fetchModel()
  }, [params.id])

  // Stop previous music on page transition
  useEffect(() => {
    return () => {
      // Stop music when leaving this page
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [params.id])

  // Confirm that music URL has been set
  useEffect(() => {
    console.log('[ViewPage] Music URL updated:', { musicUrl, musicName })
  }, [musicUrl, musicName])

  // Monitor fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])


  const handleFollowClick = () => {
    if (!user) {
      // Redirect to login page
      router.push('/profile')
      return
    }
  }

  const handleEditClick = () => {
    if (model) {
      router.push(`/edit/${model.id}`)
    }
  }

  const handleShare = async () => {
    if (!model) return
    const shareUrl = window.location.href
    const shareTitle = model.title
    const shareText = model.description || `${model.title} - Three Gallery`

    // If Web Share API is supported (mainly mobile)
    if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // Do nothing if user cancelled
        if ((err as Error).name === 'AbortError') {
          return
        }
      }
    }

    // Show modal for PC
    setShowShareModal(true)
  }

  const toggleFullscreen = async () => {
    if (!viewerContainerRef.current) return

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await viewerContainerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        // Exit fullscreen
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error)
    }
  }

  if (!model) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-400">{t.view.modelNotFound}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* HTML viewer */}
      <div 
        ref={viewerContainerRef}
        className={`bg-gray-900 relative ${isFullscreen ? 'h-screen' : 'h-[80vh]'}`}
      >
        <HtmlPreview
          htmlContent={(model.metadata?.htmlContent as string) || ''}
          height="100%"
        />
        
        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 left-4 z-20 flex items-center justify-center w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
          title={isFullscreen ? t.view.exitFullscreen : t.view.enterFullscreen}
        >
          <Maximize className="h-5 w-5" />
        </button>
        
        {/* Music player */}
        {musicUrl && (
          <div className="absolute bottom-4 right-4 z-20">
            <MusicPlayer
              musicUrl={musicUrl}
              musicName={musicName}
              autoPlay={false}
              onPlay={() => {
                // onPlay callback temporarily disabled (other music stop functionality to be implemented later)
                console.log('[ViewPage] Music started playing')
              }}
            />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          {/* Main content */}
          <div>
            {/* Title and actions */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{model.title}</h1>
              
              {/* Creator information */}
              {model.user && (
                <div className="mt-4 flex items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <Link href={`/user/${model.user.username}`} className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400">
                      {model.user.avatarUrl ? (
                        <img
                          src={model.user.avatarUrl}
                          alt={model.user.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white font-semibold">
                          {model.user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400">
                        {model.user.displayName || model.user.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatNumber(model.user.followerCount)} {t.view.followers}
                      </p>
                    </div>
                  </Link>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {user?.id === model.userId ? (
                      // Edit button for content creator
                      <button
                        onClick={handleEditClick}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="text-sm">{t.common.edit}</span>
                      </button>
                    ) : user ? (
                      // Regular follow button for logged-in users
                      <FollowButton userId={model.userId} />
                    ) : (
                      // Follow button that prompts login for unauthenticated users
                      <button
                        onClick={handleFollowClick}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        <span className="text-sm">{t.common.follow}</span>
                      </button>
                    )}
                    
                    <button
                      onClick={toggleLike}
                      className={`flex items-center gap-1 rounded-lg px-3 py-2 font-medium transition-colors ${
                        isLiked
                          ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{formatNumber(likeCount || model.likeCount)}</span>
                    </button>
                    
                    <button 
                      onClick={handleShare}
                      className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">{t.common.share}</span>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span>{formatNumber(viewCount || model.viewCount)}{t.home.views}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(model.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Tab content */}
            <div className="rounded-lg bg-white dark:bg-gray-800 p-6">
              <div className="mb-4 flex gap-4 border-b">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-2 font-medium ${
                    activeTab === 'description'
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t.view.description}
                </button>
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-2 font-medium ${
                    activeTab === 'specs'
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t.view.specs}
                </button>
                <button
                  onClick={() => setActiveTab('license')}
                  className={`pb-2 font-medium ${
                    activeTab === 'license'
                      ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  {t.view.license}
                </button>
              </div>

              {activeTab === 'description' && (
                <div>
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {model.description || t.view.noDescription}
                  </p>
                  
                  {model.tags.length > 0 && (
                    <div className="mt-6">
                      <div className="flex flex-wrap gap-2">
                        {model.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/search?tag=${encodeURIComponent(tag)}`}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">{t.view.fileSize}</span>
                    <span className="font-medium dark:text-gray-200">
                      {model.fileSize ? formatFileSize(model.fileSize) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">{t.view.format}</span>
                    <span className="font-medium dark:text-gray-200">{t.view.htmlJavaScript}</span>
                  </div>
                </div>
              )}

              {activeTab === 'license' && (
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300">{model.licenseType}</h3>
                    <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                      {t.view.licenseDescription.replace('{licenseType}', model.licenseType)}
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
                      <span className="text-sm dark:text-gray-300">
                        {t.view.commercialUse}: {model.isCommercialOk ? t.view.allowed : t.view.notAllowed}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related works */}
        {relatedModels.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold dark:text-white">{t.view.otherWorks}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedModels.slice(0, 4).map((model) => (
                <ModelCard key={model.id} model={model} showUser={false} />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Share Modal */}
      {ShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={model.title}
          url={window.location.href}
          description={model.description}
        />
      )}
    </div>
  )
}