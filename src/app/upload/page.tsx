'use client'

import { useState, useEffect } from 'react'
import { Info, Tag, Lock, LogIn, Music, Play, Pause, ChevronDown, ChevronUp, Image, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { defaultBGMs } from '@/lib/defaultBgm'
import { createClient } from '@/lib/supabase-client'
import { captureHtmlThumbnail, createPlaceholderThumbnail } from '@/lib/thumbnailCapture'

const HtmlPreview = dynamic(() => import('@/components/3d/HtmlPreview'), { ssr: false })
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
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [uploadType] = useState<'html'>('html')
  const [htmlContent, setHtmlContent] = useState('')
  const [htmlInputType, setHtmlInputType] = useState<'file' | 'code'>('file')
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
  const [thumbnailOption, setThumbnailOption] = useState<'auto' | 'custom'>('auto')
  const [customThumbnail, setCustomThumbnail] = useState<File | null>(null)
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState<string | null>(null)


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

  const handleCustomThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (validTypes.includes(file.type)) {
        if (file.size > 5 * 1024 * 1024) { // 5MB制限
          alert('サムネイル画像は5MB以下にしてください')
          return
        }
        setCustomThumbnail(file)
        const url = URL.createObjectURL(file)
        setCustomThumbnailUrl(url)
      } else {
        alert('JPEG、PNG、またはWebP形式の画像をアップロードしてください')
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
      // クリーンアップ時にプレビュー音声を停止
      if (previewAudio) {
        previewAudio.pause()
        previewAudio.currentTime = 0
      }
    }
  }, [previewAudio])

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
    
    if (!htmlContent) {
      alert('HTMLコンテンツを入力またはファイルをアップロードしてください')
      return
    }
    
    if (musicType === 'upload' && !musicFile) {
      alert('音楽ファイルをアップロードするか、デフォルトBGMを選択してください')
      return
    }

    setIsUploading(true)
    
    try {
      // サムネイルの処理
      let thumbnailUrl = null
      
      if (thumbnailOption === 'custom' && customThumbnail) {
        // カスタムサムネイルをアップロード
        console.log('[Upload] カスタムサムネイルをアップロード')
        const thumbnailFormData = new FormData()
        thumbnailFormData.append('file', customThumbnail)
        thumbnailFormData.append('type', 'custom')
        
        const thumbnailResponse = await fetch('/api/upload/thumbnail', {
          method: 'POST',
          body: thumbnailFormData
        })
        
        if (thumbnailResponse.ok) {
          const thumbnailData = await thumbnailResponse.json()
          thumbnailUrl = thumbnailData.url
          console.log('[Upload] カスタムサムネイルアップロード成功:', thumbnailUrl)
        } else {
          console.error('[Upload] カスタムサムネイルアップロード失敗')
        }
      } else if (thumbnailOption === 'auto') {
        // HTMLコンテンツからサムネイルを自動生成
        console.log('[Upload] サムネイル自動生成開始')
        
        try {
          // デバッグ: HTMLコンテンツの最初の部分を表示
          console.log('[Upload] HTMLコンテンツの先頭500文字:')
          console.log(htmlContent.substring(0, 500))
          console.log('[Upload] Canvas要素の有無をチェック:')
          console.log('Canvas要素が含まれている:', htmlContent.includes('<canvas'))
          console.log('THREE.jsが含まれている:', htmlContent.includes('THREE'))
          
          // HTMLコンテンツからサムネイルをキャプチャ
          let thumbnailBlob = await captureHtmlThumbnail(htmlContent, {
            captureDelay: 3000,  // 3秒待機してからキャプチャ（デバッグ版で成功した値）
            maxWaitTime: 15000   // 最大15秒待機
          })
          
          // キャプチャに失敗した場合はプレースホルダーを生成
          if (!thumbnailBlob) {
            console.log('[Upload] キャプチャ失敗、プレースホルダーを生成')
            thumbnailBlob = await createPlaceholderThumbnail(formData.title || 'Three.js作品')
          }
          
          // サムネイルをアップロード
          console.log('[Upload] 生成したサムネイルをアップロード')
          const thumbnailFormData = new FormData()
          thumbnailFormData.append('file', thumbnailBlob, 'thumbnail.jpg')
          thumbnailFormData.append('type', 'auto-generated')
          
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          const headers: HeadersInit = {}
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
          }
          
          try {
            const thumbnailResponse = await fetch('/api/upload/thumbnail', {
              method: 'POST',
              body: thumbnailFormData,
              headers,
              credentials: 'include'
            })
            
            if (thumbnailResponse.ok) {
              const thumbnailData = await thumbnailResponse.json()
              thumbnailUrl = thumbnailData.url
              console.log('[Upload] 自動生成サムネイルアップロード成功:', thumbnailUrl)
            } else {
              const errorData = await thumbnailResponse.text()
              console.error('[Upload] 自動生成サムネイルアップロード失敗:', thumbnailResponse.status, errorData)
              // デフォルトのプレースホルダー画像URLを使用
              thumbnailUrl = '/placeholder-html.svg'
            }
          } catch (uploadError) {
            console.error('[Upload] サムネイルアップロードエラー:', uploadError)
            // デフォルトのプレースホルダー画像URLを使用
            thumbnailUrl = '/placeholder-html.svg'
          }
        } catch (error) {
          console.error('[Upload] サムネイル自動生成エラー:', error)
          // エラーが発生してもアップロード処理は継続
        }
      }
      
      const data = new FormData()
      data.append('uploadType', uploadType)
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('tags', formData.tags)
      data.append('license', formData.license)
      data.append('isCommercialOk', formData.isCommercialOk.toString())
      data.append('status', formData.status)
      
      // サムネイル情報を追加
      data.append('thumbnailOption', thumbnailOption)
      if (thumbnailUrl) {
        data.append('thumbnailUrl', thumbnailUrl)
      }
      
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
      
      data.append('htmlContent', htmlContent)
      
      // Supabaseクライアントを作成してセッショントークンを取得
      console.log('[Upload] セッション取得中...')
      const supabase = createClient()
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
        credentials: 'include', // クッキーを含める
      })
      console.log('[Upload] APIレスポンス:', response.status)
      
      const result = await response.json()
      
      if (result.success) {
        console.log('Upload successful:', result)
        
        // ホームページにリダイレクト
        router.push('/')
      } else {
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
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500 mx-auto dark:border-gray-600 dark:border-t-blue-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未ログインの場合
  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center max-w-md">
          <LogIn className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">ログインが必要です</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            コンテンツをアップロードするにはログインが必要です
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-lg bg-blue-500 px-6 py-3 font-medium text-white hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600"
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
      <h1 className="mb-4 sm:mb-8 text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Three.jsコンテンツをアップロード</h1>


      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HTMLアップロード */}
          <div className="space-y-4">
            {/* HTML入力方法選択 */}
            <div className="rounded-lg bg-gray-800 p-4 dark:bg-gray-800">
              <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">HTML入力方法</label>
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
                  <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">HTMLファイル</label>
                  <input
                    type="file"
                    accept=".html"
                    onChange={handleFileUpload}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                  />
                </>
              ) : (
                /* HTMLコード入力 */
                <>
                  <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">HTMLコード</label>
                  <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400 font-mono text-sm"
                    rows={15}
                    placeholder="HTMLコードをここに貼り付けてください..."
                  />
                </>
              )}
            </div>
            
            {/* HTMLプレビュー */}
            {htmlContent && (
              <div className="rounded-lg bg-gray-800 dark:bg-gray-800">
                <h3 className="border-b px-4 py-2 font-medium">プレビュー</h3>
                <HtmlPreview htmlContent={htmlContent} height="500px" />
              </div>
            )}
          </div>

        {/* サムネイル設定 */}
        <div className="space-y-4 rounded-lg bg-gray-800 p-3 sm:p-6 dark:bg-gray-800">
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Image className="h-4 w-4 sm:h-5 sm:w-5" aria-label="サムネイル設定" />
            サムネイル設定
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="auto"
                  checked={thumbnailOption === 'auto'}
                  onChange={(e) => setThumbnailOption(e.target.value as 'auto' | 'custom')}
                  className="h-4 w-4"
                />
                <span className="flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  自動生成
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="custom"
                  checked={thumbnailOption === 'custom'}
                  onChange={(e) => setThumbnailOption(e.target.value as 'auto' | 'custom')}
                  className="h-4 w-4"
                />
                <span className="flex items-center gap-1">
                  <Image className="h-4 w-4" aria-label="カスタム画像" />
                  カスタム画像をアップロード
                </span>
              </label>
            </div>
            
            {thumbnailOption === 'custom' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">
                  サムネイル画像 (JPEG, PNG, WebP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleCustomThumbnailUpload}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                />
                {customThumbnail && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm text-gray-400 dark:text-gray-400">
                      ファイル: {customThumbnail.name} ({(customThumbnail.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                    {customThumbnailUrl && (
                      <img
                        src={customThumbnailUrl}
                        alt="サムネイルプレビュー"
                        className="h-40 w-auto rounded-lg border object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 基本情報 */}
        <div className="space-y-4 rounded-lg bg-gray-800 p-3 sm:p-6 dark:bg-gray-800">
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
            <Info className="h-4 w-4 sm:h-5 sm:w-5" />
            基本情報
          </h2>
          
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300 dark:text-gray-300">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              placeholder="例: 回転するキューブ"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300 dark:text-gray-300">
              説明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              rows={4}
              placeholder="コードの説明や使い方を入力してください"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300 dark:text-gray-300">
              <Tag className="inline h-4 w-4" /> タグ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              placeholder="Three.js, コード, チュートリアル（カンマ区切り）"
              required
            />
          </div>
        </div>

        {/* ライセンス設定 */}
        <div className="space-y-4 rounded-lg bg-gray-800 p-3 sm:p-6 dark:bg-gray-800">
          <h2 className="text-base sm:text-lg font-semibold">ライセンス設定</h2>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">ライセンス</label>
            <select
              value={formData.license}
              onChange={(e) => setFormData({ ...formData, license: e.target.value })}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
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
        <div className="space-y-4 rounded-lg bg-gray-800 p-3 sm:p-6 dark:bg-gray-800">
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
              <label className="block text-sm font-medium text-gray-300 dark:text-gray-300">BGMを選択</label>
              
              {/* 選択中のBGM表示とドロップダウントグル */}
              <div 
                className="flex items-center justify-between rounded-lg border border-gray-600 bg-gray-700 p-3 cursor-pointer hover:bg-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={() => setIsBgmListOpen(!isBgmListOpen)}
              >
                <div className="flex items-center gap-3">
                  <Music className="h-4 w-4 text-gray-300 dark:text-gray-300" />
                  <div>
                    <div className="font-medium text-gray-200 dark:text-gray-200">
                      {defaultBGMs.find(bgm => bgm.id === selectedBgmId)?.name || 'BGMを選択'}
                    </div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">
                      {defaultBGMs.find(bgm => bgm.id === selectedBgmId)?.genre}
                    </div>
                  </div>
                </div>
                {isBgmListOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                )}
              </div>

              {/* BGMリスト（折りたたみ可能） */}
              {isBgmListOpen && (
                <div className="space-y-1 rounded-lg border border-gray-600 bg-gray-800 p-2 max-h-64 overflow-y-auto dark:border-gray-600 dark:bg-gray-800">
                  {defaultBGMs.map((bgm) => (
                    <div
                      key={bgm.id}
                      className={`flex items-center justify-between rounded-md p-2 transition-colors cursor-pointer ${
                        selectedBgmId === bgm.id
                          ? 'bg-blue-900/30 text-blue-400 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'hover:bg-gray-700 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedBgmId(bgm.id)
                        setIsBgmListOpen(false)
                        stopBgmPreview()
                      }}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-200 dark:text-gray-200">
                          {bgm.name}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
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
                        className="ml-2 rounded-full p-1.5 text-gray-400 hover:bg-gray-600 hover:text-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200"
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
                <p className="text-sm text-gray-400 dark:text-gray-400 italic">
                  {defaultBGMs.find(bgm => bgm.id === selectedBgmId)?.description}
                </p>
              )}
            </div>
          )}

          {/* BGMアップロード */}
          {musicType === 'upload' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">
                音楽ファイル (MP3, WAV, OGG, M4A - 最大10MB)
              </label>
              <input
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,audio/*"
                onChange={handleMusicFileUpload}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-3 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
              />
              {musicFile && (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-400">
                  ファイル: {musicFile.name} ({(musicFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}
        </div>

        {/* 公開設定 */}
        <div className="space-y-4 rounded-lg bg-gray-800 p-3 sm:p-6 dark:bg-gray-800">
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
              !htmlContent || 
              !formData.title.trim() || 
              !formData.description.trim() || 
              !formData.tags.trim() || 
              (musicType === 'upload' && !musicFile) ||
              isUploading
            }
            className="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-gray-600"
          >
            {isUploading ? 'アップロード中...' : 'アップロード'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-700 px-6 py-3 font-medium hover:bg-gray-700 text-gray-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  )
}