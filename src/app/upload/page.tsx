'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Info, Tag, DollarSign, Lock, Code, Box } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const CodeEditor = dynamic(() => import('@/components/ui/CodeEditor'), { ssr: false })
const CodeSandbox = dynamic(() => import('@/components/3d/CodeSandbox'), { ssr: false })

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
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshPhongMaterial({
  color: 0x00ff00
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// アニメーション
let userAnimate = function() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
};`,
  particles: `// パーティクルシステム
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 1000;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.1,
  color: 0xffffff
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

let userAnimate = function() {
  particles.rotation.y += 0.001;
};`,
  sphere: `// 輝く球体
const geometry = new THREE.SphereGeometry(2, 32, 32);
const material = new THREE.MeshPhongMaterial({
  color: 0x2194ce,
  emissive: 0x112244,
  shininess: 100
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);

let userAnimate = function() {
  sphere.rotation.y += 0.01;
  const time = Date.now() * 0.001;
  sphere.position.y = Math.sin(time) * 2;
};`
}

export default function UploadPage() {
  const router = useRouter()
  const [uploadType, setUploadType] = useState<'file' | 'code'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [code, setCode] = useState(codeTemplates.basic)
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
      'application/octet-stream': ['.fbx'],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  })

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template)
    setCode(codeTemplates[template as keyof typeof codeTemplates])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadType === 'file' && !file) return
    if (uploadType === 'code' && !code) return

    setIsUploading(true)
    
    // ここで実際のアップロード処理を実装
    // uploadTypeによって処理を分岐
    // - file: ファイルをSupabase Storageにアップロード
    // - code: コードをデータベースに保存
    
    setTimeout(() => {
      setIsUploading(false)
      router.push('/')
    }, 2000)
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-8 text-3xl font-bold">3Dコンテンツをアップロード</h1>

      {/* アップロードタイプ選択 */}
      <div className="mb-6 flex gap-4 rounded-lg bg-white p-4">
        <button
          onClick={() => setUploadType('file')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            uploadType === 'file'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Box className="h-5 w-5" />
          3Dモデルファイル
        </button>
        <button
          onClick={() => setUploadType('code')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
            uploadType === 'code'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Code className="h-5 w-5" />
          Three.jsコード
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ファイルアップロード or コードエディタ */}
        {uploadType === 'file' ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8">
            {!file ? (
              <div {...getRootProps()} className="cursor-pointer text-center">
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-lg font-medium">
                  {isDragActive
                    ? 'ここにドロップしてください'
                    : '3Dモデルファイルをドラッグ&ドロップ'}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  または<span className="text-blue-600">ファイルを選択</span>
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  対応形式: GLB, GLTF, FBX (最大500MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File className="h-10 w-10 text-blue-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
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
              placeholder={uploadType === 'file' ? '例: ファンタジーキャラクター' : '例: 回転するキューブ'}
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
              placeholder={
                uploadType === 'file'
                  ? 'モデルの詳細な説明を入力してください'
                  : 'コードの説明や使い方を入力してください'
              }
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
              placeholder={
                uploadType === 'file'
                  ? 'キャラクター, ファンタジー, アニメーション（カンマ区切り）'
                  : 'Three.js, コード, チュートリアル（カンマ区切り）'
              }
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
            disabled={
              (uploadType === 'file' && !file) ||
              (uploadType === 'code' && !code) ||
              !formData.title ||
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