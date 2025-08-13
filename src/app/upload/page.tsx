'use client'

import { useState, useEffect } from 'react'
import { Info, Tag, DollarSign, Lock, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/contexts/AuthContext'
import { Model } from '@/types'

const CodeEditor = dynamic(() => import('@/components/ui/CodeEditor'), { ssr: false })
const CodeSandbox = dynamic(() => import('@/components/3d/CodeSandbox'), { ssr: false })
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

const codeTemplates = {
  basic: `// 基本的なThree.jsシーン
// THREE, scene, camera, renderer, controlsは既に定義されています

// 立方体を作成
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshPhongMaterial({
  color: 0x00ff00,
  wireframe: false
});
const cube = new THREE.Mesh(geometry, material);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

// アニメーション関数を定義
userAnimate = function() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
};`,
  particles: `// パーティクルシステム
// THREE, scene, camera, renderer, controlsは既に定義されています

const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 1000;
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20;
  colors[i] = Math.random();
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.1,
  vertexColors: true,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

// アニメーション関数を定義
userAnimate = function() {
  particles.rotation.y += 0.001;
  particles.rotation.x += 0.0005;
};`,
  sphere: `// 輝く球体
// THREE, scene, camera, renderer, controlsは既に定義されています

// 球体を作成
const geometry = new THREE.SphereGeometry(2, 32, 32);
const material = new THREE.MeshPhongMaterial({
  color: 0x2194ce,
  emissive: 0x112244,
  shininess: 100,
  specular: 0xffffff
});
const sphere = new THREE.Mesh(geometry, material);
sphere.castShadow = true;
sphere.receiveShadow = true;
scene.add(sphere);

// 追加の光源
const pointLight = new THREE.PointLight(0xff00ff, 1, 100);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

// アニメーション関数を定義
userAnimate = function() {
  sphere.rotation.y += 0.01;
  const time = Date.now() * 0.001;
  sphere.position.y = Math.sin(time) * 2;
  pointLight.position.x = Math.sin(time * 0.7) * 5;
  pointLight.position.z = Math.cos(time * 0.7) * 5;
};`
}

export default function UploadPage() {
  const router = useRouter()
  const addModel = useStore((state) => state.addModel)
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [uploadType, setUploadType] = useState<'code' | 'html' | 'model'>('code')
  const [code, setCode] = useState(codeTemplates.basic)
  const [htmlContent, setHtmlContent] = useState('')
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('basic')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    license: 'CC BY',
    isCommercialOk: true,
    isFree: true,
    price: 0,
    status: 'public' as 'public' | 'private',
  })
  const [isUploading, setIsUploading] = useState(false)

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template)
    setCode(codeTemplates[template as keyof typeof codeTemplates])
  }

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

  useEffect(() => {
    return () => {
      if (modelUrl) {
        URL.revokeObjectURL(modelUrl)
      }
    }
  }, [modelUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadType === 'code' && !code) return
    if (uploadType === 'html' && !htmlContent) return
    if (uploadType === 'model' && !modelFile) return

    setIsUploading(true)
    
    try {
      const data = new FormData()
      data.append('uploadType', uploadType)
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('tags', formData.tags)
      data.append('license', formData.license)
      data.append('isCommercialOk', formData.isCommercialOk.toString())
      data.append('isFree', formData.isFree.toString())
      data.append('price', formData.price.toString())
      data.append('status', formData.status)
      
      if (uploadType === 'code') {
        data.append('code', code)
        data.append('template', selectedTemplate)
      } else if (uploadType === 'html') {
        data.append('htmlContent', htmlContent)
      } else if (uploadType === 'model') {
        data.append('modelFile', modelFile!)
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      })
      
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
            thumbnailUrl: result.model.thumbnail_url || '/placeholder-3d.jpg',
            fileUrl: result.model.file_url,
            fileSize: result.model.file_size || 0,
            polygonCount: result.model.polygon_count || 0,
            hasAnimation: result.model.has_animation || false,
            animationDuration: result.model.animation_duration || 0,
            licenseType: result.model.license_type || 'CC BY',
            isCommercialOk: result.model.is_commercial_ok !== false,
            price: result.model.price || 0,
            currency: result.model.currency || 'JPY',
            isFree: result.model.is_free !== false,
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
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-8 text-3xl font-bold">Three.jsコンテンツをアップロード</h1>

      {/* アップロードタイプ選択 */}
      <div className="mb-6 rounded-lg bg-white p-4">
        <label className="mb-2 block text-sm font-medium">アップロードタイプ</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="code"
              checked={uploadType === 'code'}
              onChange={(e) => setUploadType(e.target.value as 'code' | 'html' | 'model')}
              className="h-4 w-4"
            />
            <span>Three.jsコード</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="html"
              checked={uploadType === 'html'}
              onChange={(e) => setUploadType(e.target.value as 'code' | 'html' | 'model')}
              className="h-4 w-4"
            />
            <span>HTMLファイル</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="model"
              checked={uploadType === 'model'}
              onChange={(e) => setUploadType(e.target.value as 'code' | 'html' | 'model')}
              className="h-4 w-4"
            />
            <span>3Dモデル (GLB/GLTF)</span>
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* コードエディタまたはHTMLアップロード */}
        {uploadType === 'code' ? (
          <div className="space-y-4">
            {/* テンプレート選択 */}
            <div className="rounded-lg bg-white p-4">
              <label className="mb-2 block text-sm font-medium">テンプレート</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTemplateChange('basic')}
                  className={`rounded px-3 py-1 text-sm ${
                    selectedTemplate === 'basic'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  基本
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateChange('particles')}
                  className={`rounded px-3 py-1 text-sm ${
                    selectedTemplate === 'particles'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  パーティクル
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateChange('sphere')}
                  className={`rounded px-3 py-1 text-sm ${
                    selectedTemplate === 'sphere'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  球体
                </button>
              </div>
            </div>

            {/* コードエディタとプレビュー */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg bg-white">
                <h3 className="border-b px-4 py-2 font-medium">コードエディタ</h3>
                <CodeEditor
                  initialCode={code}
                  onChange={setCode}
                  height="500px"
                  showControls={false}
                />
              </div>
              <div className="rounded-lg bg-white">
                <h3 className="border-b px-4 py-2 font-medium">プレビュー</h3>
                <CodeSandbox code={code} height="500px" />
              </div>
            </div>
          </div>
        ) : uploadType === 'html' ? (
          <div className="space-y-4">
            {/* HTMLファイルアップロード */}
            <div className="rounded-lg bg-white p-4">
              <label className="mb-2 block text-sm font-medium">HTMLファイル</label>
              <input
                type="file"
                accept=".html"
                onChange={handleFileUpload}
                className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
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
        <div className="space-y-4 rounded-lg bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Info className="h-5 w-5" />
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
            <label className="mb-1 block text-sm font-medium">説明</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
              rows={4}
              placeholder="コードの説明や使い方を入力してください"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              <Tag className="inline h-4 w-4" /> タグ
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Three.js, コード, チュートリアル（カンマ区切り）"
            />
          </div>
        </div>

        {/* ライセンス設定 */}
        <div className="space-y-4 rounded-lg bg-white p-6">
          <h2 className="text-lg font-semibold">ライセンス設定</h2>
          
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

        {/* 価格設定 */}
        <div className="space-y-4 rounded-lg bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <DollarSign className="h-5 w-5" />
            価格設定
          </h2>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formData.isFree}
                onChange={() => setFormData({ ...formData, isFree: true, price: 0 })}
                className="h-4 w-4"
              />
              <span>無料</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!formData.isFree}
                onChange={() => setFormData({ ...formData, isFree: false })}
                className="h-4 w-4"
              />
              <span>有料</span>
            </label>
          </div>

          {!formData.isFree && (
            <div className="flex items-center gap-2">
              <span className="text-lg">¥</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                className="w-32 rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
                min="100"
                step="100"
              />
            </div>
          )}
        </div>

        {/* 公開設定 */}
        <div className="space-y-4 rounded-lg bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Lock className="h-5 w-5" />
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
            disabled={(uploadType === 'code' && !code) || (uploadType === 'html' && !htmlContent) || (uploadType === 'model' && !modelFile) || !formData.title || isUploading}
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