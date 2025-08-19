'use client'

import { useState, useEffect } from 'react'
import { Info, Tag, Lock, LogIn, Music, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/contexts/AuthContext'
import { Model } from '@/types'
import { defaultBGMs } from '@/lib/defaultBgm'
import { supabase } from '@/lib/supabase'

const HtmlPreview = dynamic(() => import('@/components/3d/HtmlPreview'), { ssr: false })
const ModelViewer = dynamic(() => import('@/components/3d/ModelViewer'), { ssr: false })
const AuthModal = dynamic(() => import('@/components/ui/AuthModal'), { ssr: false })

const licenses = [
  { id: 'CC BY', label: 'CC BY', description: '適切なクレジット表示で自由に使用可' },
  { id: 'CC BY-SA', label: 'CC BY-SA', description: '同じライセンスで再配布' },
  { id: 'CC BY-NC', label: 'CC BY-NC', description: '非商用利用のみ' },
  { id: 'CC BY-NC-SA', label: 'CC BY-NC-SA', description: '非商用・同一ライセンス' },
  { id: 'CC0', label: 'CC0', description: 'パブリックドメイン' },
  { id: 'MIT', label: 'MIT', description: 'MITライセンス' },
]


export default function UploadPage() {
  const router = useRouter()
  const addModel = useStore((state) => state.addModel)
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [uploadType, setUploadType] = useState<'html' | 'model'>('html')
  const [htmlContent, setHtmlContent] = useState('')
  const [htmlInputType, setHtmlInputType] = useState<'file' | 'code'>('file')
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    license: 'CC BY',
    isCommercialOk: true,
    status: 'public' as 'public' | 'private',
  })
  const [isUploading, setIsUploading] = useState(false)
  const [musicFile, setMusicFile] = useState<File | null>(null)
  const [musicType, setMusicType] = useState<'upload' | 'default'>('default')
  const [selectedBgmId, setSelectedBgmId] = useState<string>('ambient-1')
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null)
  const [isBgmListOpen, setIsBgmListOpen] = useState(false)


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/html') {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setHtmlContent(content)
      }
      reader.readAsText(file)
    }
  }

  const handleModelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
      setModelFile(file)
      const url = URL.createObjectURL(file)
      setModelUrl(url)
    } else {
      alert('GLBまたはGLTF形式のファイルをアップロードしてください')
    }
  }

  const handleMusicFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
      if (validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        if (file.size > 10 * 1024 * 1024) { // 10MB制限
          alert('音楽ファイルは10MB以下にしてください')
          return
        }
        setMusicFile(file)
      } else {
        alert('MP3、WAV、OGG、またはM4A形式のファイルをアップロードしてください')
      }
    }
  }

  const handleBgmPreview = (bgmId: string) => {
    // 既存のプレビューを停止
    if (previewAudio) {
      previewAudio.pause()
      previewAudio.currentTime = 0
    }

    const bgm = defaultBGMs.find(b => b.id === bgmId)
    if (!bgm) return

    const audio = new Audio(bgm.url)
    audio.volume = 0.3
    audio.play().catch(err => {
      console.error('BGM preview playback failed:', err)
    })
    
    setPreviewAudio(audio)
  }

  const stopBgmPreview = () => {
    if (previewAudio) {
      previewAudio.pause()
      previewAudio.currentTime = 0
      setPreviewAudio(null)
    }
  }

  useEffect(() => {
    return () => {
      if (modelUrl) {
        URL.revokeObjectURL(modelUrl)
      }
      // クリーンアップ時にプレビュー音声を停止
      if (previewAudio) {
        previewAudio.pause()
        previewAudio.currentTime = 0
      }
    }
  }, [modelUrl, previewAudio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[Upload] handleSubmit開始 - user:', user?.email)
    
    // ユーザーチェック
    if (!user) {
      console.log('[Upload] ユーザーが未ログイン')
      alert('ログインが必要です')
      setShowAuthModal(true)
      return
    }
    
    // 必須項目のバリデーション
    if (!formData.title.trim()) {
      alert('タイトルを入力してください')
      return
    }
    
    if (!formData.description.trim()) {
      alert('説明を入力してください')
      return
    }
    
    if (!formData.tags.trim()) {
      alert('タグを入力してください')
      return
    }
    
    if (uploadType === 'html' && !htmlContent) {
      alert('HTMLコンテンツを入力またはファイルをアップロードしてください')
      return
    }
    
    if (uploadType === 'model' && !modelFile) {
      alert('3Dモデルファイルをアップロードしてください')
      return
    }
    
    if (musicType === 'upload' && !musicFile) {
      alert('音楽ファイルをアップロードするか、デフォルトBGMを選択してください')
      return
    }

    setIsUploading(true)
    
    try {
      const data = new FormData()
      data.append('uploadType', uploadType)
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('tags', formData.tags)
      data.append('license', formData.license)
      data.append('isCommercialOk', formData.isCommercialOk.toString())
      data.append('status', formData.status)
      
      // 音楽関連のデータを追加
      console.log('[Upload Page] 音楽データ送信:', {
        musicType,
        hasMusicFile: !!musicFile,
        musicFileName: musicFile?.name,
        selectedBgmId
      })
      
      data.append('musicType', musicType)
      if (musicType === 'upload' && musicFile) {
        console.log('[Upload Page] 音楽ファイルをFormDataに追加:', musicFile.name)
        data.append('musicFile', musicFile)
      } else if (musicType === 'default') {
        console.log('[Upload Page] デフォルトBGM IDをFormDataに追加:', selectedBgmId)
        data.append('selectedBgmId', selectedBgmId)
      }
      
      if (uploadType === 'html') {
        data.append('htmlContent', htmlContent)
      } else if (uploadType === 'model') {
        data.append('modelFile', modelFile!)
      }
      
      // Supabaseのセッショントークンを取得
      console.log('[Upload] セッション取得中...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[Upload] セッション:', session?.user?.email, 'トークン有無:', !!session?.access_token)
      
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      console.log('[Upload] APIリクエスト送信中...')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
        headers,
      })
      console.log('[Upload] APIレスポンス:', response.status)
      
      const result = await response.json()
      
      if (result.success) {
        // 成功メッセージを表示（オプション）
        console.log('Upload successful:', result)
        
        // storeにモデルを追加
        if (result.model) {
          const newModel: Model = {
            id: result.model.id || Math.random().toString(36).substr(2, 9),
            userId: user?.id || 'demo-user',
            user: {
              id: user?.id || 'demo-user',
              username: user?.email?.split('@')[0] || 'demo-user',
              displayName: user?.email?.split('@')[0] || 'Demo User',
              avatarUrl: user?.user_metadata?.avatar_url || '/avatars/user-1.jpg',
              isPremium: false,
              followerCount: 0,
              followingCount: 0,
              createdAt: new Date().toISOString(),
            },
            title: result.model.title,
            description: result.model.description || '',
            thumbnailUrl: result.model.thumbnail_url || '/placeholder-3d.svg',
            fileUrl: result.model.file_url,
            fileSize: result.model.file_size || 0,
            polygonCount: result.model.polygon_count || 0,
            hasAnimation: result.model.has_animation || false,
            animationDuration: result.model.animation_duration || 0,
            licenseType: result.model.license_type || 'CC BY',
            isCommercialOk: result.model.is_commercial_ok !== false,
            viewCount: 0,
            downloadCount: 0,
            likeCount: 0,
            status: 'public' as const,
            tags: result.model.tags || [],
            metadata: result.model.metadata || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          addModel(newModel)
        }
        
        router.push('/')
      } else {
        // エラーメッセージを表示
        console.error('Upload failed:', result.error)
        alert(`アップロードに失敗しました: ${result.error}`)
        setIsUploading(false)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('アップロード中にエラーが発生しました')
      setIsUploading(false)
    }
  }

  // ローディング中
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未ログインの場合
  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center max-w-md">
          <LogIn className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">
            コンテンツをアップロードするにはログインが必要です
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            ログイン / 新規登録
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
    <div className="mx-auto max-w-6xl p-3 sm:p-6">
      <h1 className="mb-4 sm:mb-8 text-xl sm:text-3xl font-bold">Three.jsコンテンツをアップロード</h1>

      {/* アップロードタイプ選択 */}
      <div className="mb-4 sm:mb-6 rounded-lg bg-white p-3 sm:p-4">
        <label className="mb-2 block text-sm font-medium">アップロードタイプ</label>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="html"
              checked={uploadType === 'html'}
              onChange={(e) => setUploadType(e.target.value as 'html' | 'model')}
              className="h-4 w-4"
            />
            <span className="text-sm sm:text-base">HTMLファイル</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="model"
              checked={uploadType === 'model'}
              onChange={(e) => setUploadType(e.target.value as 'html' | 'model')}
              className="h-4 w-4"
            />
            <span className="text-sm sm:text-base">3Dモデル (GLB/GLTF)</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HTMLアップロード */}
        {uploadType === 'html' ? (
          <div className="space-y-4">
            {/* HTML入力方法選択 */}
            <div className="rounded-lg bg-white p-4">
              <label className="mb-2 block text-sm font-medium">HTML入力方法</label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="file"
                    checked={htmlInputType === 'file'}
                    onChange={(e) => setHtmlInputType(e.target.value as 'file' | 'code')}
                    className="h-4 w-4"
                  />
                  <span>ファイルアップロード</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="code"
                    checked={htmlInputType === 'code'}
                    onChange={(e) => setHtmlInputType(e.target.value as 'file' | 'code')}
                    className="h-4 w-4"
                  />
                  <span>コードを貼り付け</span>
                </label>
              </div>
              
              {/* HTMLファイルアップロード */}
              {htmlInputType === 'file' ? (
                <>
                  <label className="mb-2 block text-sm font-medium">HTMLファイル</label>
                  <input
                    type="file"
                    accept=".html"
                    onChange={handleFileUpload}
                    className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </>
              ) : (
                /* HTMLコード入力 */
                <>
                  <label className="mb-2 block text-sm font-medium">HTMLコード</label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none font-mono text-sm"
                    rows={15}
                    placeholder="HTMLコードをここに貼り付けてください..."
                  />
                </>
              )}
            </div>
            
            {/* HTMLプレビュー */}
            {htmlContent && (
              <div className="rounded-lg bg-white">
                <h3 className="border-b px-4 py-2 font-medium">プレビュー</h3>
                <HtmlPreview htmlContent={htmlContent} height="500px" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 3Dモデルファイルアップロード */}
            <div className="rounded-lg bg-white p-4">
              <label className="mb-2 block text-sm font-medium">3Dモデルファイル (GLB/GLTF)</label>
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={handleModelFileUpload}
                className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              {modelFile && (
                <p className="mt-2 text-sm text-gray-600">
                  ファイル: {modelFile.name} ({(modelFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            
            {/* 3Dモデルプレビュー */}
            {modelUrl && (
              <div className="rounded-lg bg-white">
                <h3 className="border-b px-4 py-2 font-medium">プレビュー</h3>
                <div className="h-[500px]">
                  <ModelViewer 
                    modelUrl={modelUrl}
                    modelType="file"
                    autoRotate={true}
                    showGrid={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 基本情報 */}
        <div className="space-y-4 rounded-lg bg-white p-3 sm:p-6">
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Info className="h-4 w-4 sm:h-5 sm:w-5" />
            基本情報
          </h2>
          
          <div>
            <label className="mb-1 block text-sm font-medium">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="例: 回転するキューブ"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
              rows={4}
              placeholder="コードの説明や使い方を入力してください"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              <Tag className="inline h-4 w-4" /> タグ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Three.js, コード, チュートリアル（カンマ区切り）"
              required
            />
          </div>
        </div>

        {/* ライセンス設定 */}
        <div className="space-y-4 rounded-lg bg-white p-3 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold">ライセンス設定</h2>
          
          <div>
            <label className="mb-2 block text-sm font-medium">ライセンス</label>
            <select
              value={formData.license}
              onChange={(e) => setFormData({ ...formData, license: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
            >
              {licenses.map((license) => (
                <option key={license.id} value={license.id}>
                  {license.label} - {license.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="commercial"
              checked={formData.isCommercialOk}
              onChange={(e) => setFormData({ ...formData, isCommercialOk: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="commercial" className="text-sm">
              商用利用を許可する
            </label>
          </div>
        </div>

        {/* BGM設定 */}
        <div className="space-y-4 rounded-lg bg-white p-3 sm:p-6">
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Music className="h-4 w-4 sm:h-5 sm:w-5" />
            BGM設定
          </h2>
          
          {/* BGMタイプ選択 */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="default"
                checked={musicType === 'default'}
                onChange={() => setMusicType('default')}
                className="h-4 w-4"
              />
              <span>デフォルトBGMから選択</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="upload"
                checked={musicType === 'upload'}
                onChange={() => setMusicType('upload')}
                className="h-4 w-4"
              />
              <span>BGMをアップロード</span>
            </label>
          </div>

          {/* デフォルトBGM選択 */}
          {musicType === 'default' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">BGMを選択</label>
              
              {/* 選択中のBGM表示とドロップダウントグル */}
              <div 
                className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 p-3 cursor-pointer hover:bg-gray-100"
                onClick={() => setIsBgmListOpen(!isBgmListOpen)}
              >
                <div className="flex items-center gap-3">
                  <Music className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="font-medium">
                      {defaultBGMs.find(bgm => bgm.id === selectedBgmId)?.name || 'BGMを選択'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {defaultBGMs.find(bgm => bgm.id === selectedBgmId)?.genre}
                    </div>
                  </div>
                </div>
                {isBgmListOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* BGMリスト（折りたたみ可能） */}
              {isBgmListOpen && (
                <div className="space-y-1 rounded-lg border border-gray-200 bg-white p-2 max-h-64 overflow-y-auto">
                  {defaultBGMs.map((bgm) => (
                    <div
                      key={bgm.id}
                      className={`flex items-center justify-between rounded-md p-2 transition-colors cursor-pointer ${
                        selectedBgmId === bgm.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedBgmId(bgm.id)
                        setIsBgmListOpen(false)
                        stopBgmPreview()
                      }}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {bgm.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {bgm.genre}
                          {bgm.description && ` - ${bgm.description}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (previewAudio && selectedBgmId === bgm.id) {
                            stopBgmPreview()
                          } else {
                            setSelectedBgmId(bgm.id)
                            handleBgmPreview(bgm.id)
                          }
                        }}
                        className="ml-2 rounded-full p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        title="試聴"
                      >
                        {previewAudio && selectedBgmId === bgm.id ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 選択中のBGMの説明 */}
              {defaultBGMs.find(bgm => bgm.id === selectedBgmId)?.description && (
                <p className="text-sm text-gray-600 italic">
                  {defaultBGMs.find(bgm => bgm.id === selectedBgmId)?.description}
                </p>
              )}
            </div>
          )}

          {/* BGMアップロード */}
          {musicType === 'upload' && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                音楽ファイル (MP3, WAV, OGG, M4A - 最大10MB)
              </label>
              <input
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,audio/*"
                onChange={handleMusicFileUpload}
                className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              {musicFile && (
                <p className="mt-2 text-sm text-gray-600">
                  ファイル: {musicFile.name} ({(musicFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}
        </div>

        {/* 公開設定 */}
        <div className="space-y-4 rounded-lg bg-white p-3 sm:p-6">
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5" />
            公開設定
          </h2>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formData.status === 'public'}
                onChange={() => setFormData({ ...formData, status: 'public' })}
                className="h-4 w-4"
              />
              <span>公開</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formData.status === 'private'}
                onChange={() => setFormData({ ...formData, status: 'private' })}
                className="h-4 w-4"
              />
              <span>限定公開</span>
            </label>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={
              (uploadType === 'html' && !htmlContent) || 
              (uploadType === 'model' && !modelFile) || 
              !formData.title.trim() || 
              !formData.description.trim() || 
              !formData.tags.trim() || 
              (musicType === 'upload' && !musicFile) ||
              isUploading
            }
            className="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isUploading ? 'アップロード中...' : 'アップロード'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}