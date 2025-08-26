'use client'

import { useState } from 'react'
import { captureHtmlThumbnailDebug } from '@/lib/thumbnailCaptureDebug'
import { captureHtmlThumbnailSimple } from '@/lib/thumbnailCaptureSimple'
import { createPlaceholderThumbnail } from '@/lib/thumbnailCapture'

// サンプルのThree.js HTML
const sampleHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Three.js Test</title>
    <style>
        body { margin: 0; overflow: hidden; }
        canvas { display: block; }
    </style>
</head>
<body>
    <script src="https://unpkg.com/three@0.152.0/build/three.min.js"></script>
    <script>
        // シーンの作成
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);

        // カメラの作成
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 5;

        // レンダラーの作成
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // ライトの追加
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        scene.add(light);
        
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        // キューブの作成
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff00,
            shininess: 100
        });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // アニメーション
        function animate() {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }

        animate();

        // リサイズ対応
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>`

export default function DebugThumbnailPage() {
  const [htmlContent, setHtmlContent] = useState(sampleHtml)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureMethod, setCaptureMethod] = useState<'debug' | 'simple'>('debug')
  
  const handleCapture = async () => {
    setIsCapturing(true)
    setThumbnailUrl(null)
    
    try {
      console.log('[Debug Page] キャプチャ開始 - 方式:', captureMethod)
      
      let blob: Blob | null = null
      
      if (captureMethod === 'debug') {
        blob = await captureHtmlThumbnailDebug(htmlContent, {
          captureDelay: 3000,
          maxWaitTime: 15000
        })
      } else {
        blob = await captureHtmlThumbnailSimple(htmlContent, {
          delay: 3000
        })
      }
      
      if (blob) {
        const url = URL.createObjectURL(blob)
        setThumbnailUrl(url)
        console.log('[Debug Page] サムネイル生成成功')
      } else {
        console.log('[Debug Page] サムネイル生成失敗、プレースホルダーを生成')
        const placeholder = await createPlaceholderThumbnail('キャプチャ失敗')
        const url = URL.createObjectURL(placeholder)
        setThumbnailUrl(url)
      }
    } catch (error) {
      console.error('[Debug Page] エラー:', error)
    } finally {
      setIsCapturing(false)
    }
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
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">サムネイル生成デバッグ</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">キャプチャ方式</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="debug"
              checked={captureMethod === 'debug'}
              onChange={(e) => setCaptureMethod(e.target.value as 'debug')}
              className="mr-2"
            />
            デバッグ版（可視iframe）
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="simple"
              checked={captureMethod === 'simple'}
              onChange={(e) => setCaptureMethod(e.target.value as 'simple')}
              className="mr-2"
            />
            シンプル版（非表示iframe）
          </label>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">HTMLファイルをアップロード</label>
        <input
          type="file"
          accept=".html"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">HTMLコンテンツ</label>
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          className="w-full h-64 p-2 border border-gray-300 rounded-md font-mono text-xs bg-gray-50"
          placeholder="HTMLコンテンツを入力..."
        />
      </div>
      
      <div className="mb-6">
        <button
          onClick={handleCapture}
          disabled={isCapturing || !htmlContent}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCapturing ? 'キャプチャ中...' : 'サムネイルをキャプチャ'}
        </button>
      </div>
      
      {thumbnailUrl && (
        <div className="border-2 border-gray-300 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">生成されたサムネイル</h2>
          <img 
            src={thumbnailUrl} 
            alt="Generated thumbnail" 
            className="max-w-full h-auto border border-gray-200"
          />
          <p className="mt-2 text-sm text-gray-600">
            URL: {thumbnailUrl}
          </p>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">デバッグ情報</h3>
        <p className="text-sm text-gray-600">
          コンソールを開いて詳細なデバッグ情報を確認してください。
        </p>
        <p className="text-sm text-gray-600 mt-2">
          デバッグ版を選択した場合、右上に赤枠のiframeが表示されます。
        </p>
      </div>
    </div>
  )
}