import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface ThumbnailOptions {
  width?: number
  height?: number
  quality?: number
  backgroundColor?: string
}

const DEFAULT_OPTIONS: ThumbnailOptions = {
  width: 1200,
  height: 630,
  quality: 0.95,
  backgroundColor: '#f0f0f0'
}

/**
 * 3Dモデル（GLB/GLTF）のサムネイルを生成
 */
export async function generateModelThumbnail(
  modelUrl: string,
  options: ThumbnailOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    // キャンバスを作成
    const canvas = document.createElement('canvas')
    canvas.width = opts.width!
    canvas.height = opts.height!
    
    // Three.jsのセットアップ
    const renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true
    })
    renderer.setSize(opts.width!, opts.height!)
    renderer.setClearColor(opts.backgroundColor!, 1)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(opts.backgroundColor!)
    
    // カメラのセットアップ
    const camera = new THREE.PerspectiveCamera(
      45,
      opts.width! / opts.height!,
      0.1,
      1000
    )
    
    // ライティングのセットアップ
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)
    
    // 環境光の追加
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3)
    scene.add(hemisphereLight)
    
    // GLTFローダーでモデルを読み込み
    const loader = new GLTFLoader()
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene
        
        // モデルの中心と境界を計算
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        // モデルを中心に配置
        model.position.sub(center)
        
        // 影の設定
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        
        scene.add(model)
        
        // カメラの位置を調整
        const maxDim = Math.max(size.x, size.y, size.z)
        const fov = camera.fov * (Math.PI / 180)
        const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5
        
        camera.position.set(
          cameraDistance * 0.8,
          cameraDistance * 0.6,
          cameraDistance
        )
        camera.lookAt(0, 0, 0)
        
        // レンダリング
        renderer.render(scene, camera)
        
        // キャンバスをBlobに変換
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to generate thumbnail'))
            }
            
            // クリーンアップ
            renderer.dispose()
          },
          'image/jpeg',
          opts.quality
        )
      },
      undefined,
      (error) => {
        reject(error)
      }
    )
  })
}

/**
 * Three.jsコードのサムネイルを生成
 */
export async function generateCodeThumbnail(
  code: string,
  options: ThumbnailOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    // サンドボックスiframeを作成
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.width = `${opts.width}px`
    iframe.style.height = `${opts.height}px`
    
    // サンドボックスHTMLを作成
    const sandboxHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              overflow: hidden;
              background: ${opts.backgroundColor};
            }
            canvas { display: block; }
          </style>
          <script src="https://unpkg.com/three@0.150.0/build/three.min.js"></script>
          <script src="https://unpkg.com/three@0.150.0/examples/js/controls/OrbitControls.js"></script>
        </head>
        <body>
          <script>
            let scene, camera, renderer;
            
            try {
              ${code}
              
              // 初期レンダリング
              if (typeof animate === 'function') {
                // アニメーションがある場合は少し待ってからキャプチャ
                setTimeout(() => {
                  parent.postMessage({
                    type: 'capture',
                    canvas: renderer.domElement.toDataURL('image/jpeg', ${opts.quality})
                  }, '*');
                }, 1000);
              } else {
                // 静的な場合はすぐにキャプチャ
                setTimeout(() => {
                  if (renderer && renderer.domElement) {
                    parent.postMessage({
                      type: 'capture',
                      canvas: renderer.domElement.toDataURL('image/jpeg', ${opts.quality})
                    }, '*');
                  }
                }, 100);
              }
            } catch (error) {
              parent.postMessage({
                type: 'error',
                message: error.message
              }, '*');
            }
          </script>
        </body>
      </html>
    `
    
    // メッセージリスナーを設定
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'capture') {
        // DataURLをBlobに変換
        fetch(event.data.canvas)
          .then(res => res.blob())
          .then(blob => {
            resolve(blob)
            // クリーンアップ
            window.removeEventListener('message', handleMessage)
            document.body.removeChild(iframe)
          })
          .catch(reject)
      } else if (event.data.type === 'error') {
        reject(new Error(event.data.message))
        window.removeEventListener('message', handleMessage)
        document.body.removeChild(iframe)
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // iframeをドキュメントに追加
    document.body.appendChild(iframe)
    
    // HTMLをiframeに書き込み
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(sandboxHtml)
      iframeDoc.close()
    } else {
      reject(new Error('Failed to access iframe document'))
    }
    
    // タイムアウト設定
    setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
      reject(new Error('Thumbnail generation timeout'))
    }, 10000)
  })
}

/**
 * HTMLファイルのサムネイルを生成
 */
export async function generateHtmlThumbnail(
  htmlContent: string,
  options: ThumbnailOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    // サンドボックスiframeを作成
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.left = '-9999px'
    iframe.style.width = `${opts.width}px`
    iframe.style.height = `${opts.height}px`
    
    // メッセージリスナーを設定
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ready') {
        // html2canvasを使用してスクリーンショットを取得
        setTimeout(() => {
          captureIframeContent()
        }, 2000) // コンテンツが完全に読み込まれるまで待機
      }
    }
    
    const captureIframeContent = async () => {
      try {
        // iframeの内容をキャプチャ
        const canvas = document.createElement('canvas')
        canvas.width = opts.width!
        canvas.height = opts.height!
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          throw new Error('Failed to get canvas context')
        }
        
        // iframeのコンテンツをcanvasに描画（セキュリティ制限により実際には動作しない可能性）
        // 代替案: iframeにキャプチャ機能を組み込む
        const modifiedHtml = htmlContent.replace(
          '</body>',
          `
          <script>
            setTimeout(() => {
              // Three.jsのrendererを探す
              if (typeof renderer !== 'undefined' && renderer.domElement) {
                const dataUrl = renderer.domElement.toDataURL('image/jpeg', ${opts.quality});
                parent.postMessage({
                  type: 'capture',
                  canvas: dataUrl
                }, '*');
              } else {
                // canvas要素を探す
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  const dataUrl = canvas.toDataURL('image/jpeg', ${opts.quality});
                  parent.postMessage({
                    type: 'capture',
                    canvas: dataUrl
                  }, '*');
                }
              }
            }, 2000);
          </script>
          </body>`
        )
        
        // 修正されたHTMLをiframeに設定
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          iframeDoc.open()
          iframeDoc.write(modifiedHtml)
          iframeDoc.close()
        }
      } catch (error) {
        reject(error)
      }
    }
    
    // キャプチャメッセージのリスナー
    const captureListener = (event: MessageEvent) => {
      if (event.data.type === 'capture') {
        fetch(event.data.canvas)
          .then(res => res.blob())
          .then(blob => {
            resolve(blob)
            // クリーンアップ
            window.removeEventListener('message', captureListener)
            document.body.removeChild(iframe)
          })
          .catch(reject)
      }
    }
    
    window.addEventListener('message', handleMessage)
    window.addEventListener('message', captureListener)
    
    // iframeをドキュメントに追加
    document.body.appendChild(iframe)
    
    // 初期HTMLを設定
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()
    }
    
    // タイムアウト設定
    setTimeout(() => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('message', captureListener)
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
      reject(new Error('Thumbnail generation timeout'))
    }, 15000)
  })
}

/**
 * サムネイルをSupabase Storageにアップロード
 */
export async function uploadThumbnailToStorage(
  blob: Blob,
  fileName: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', blob, fileName)
  formData.append('type', 'thumbnail')
  
  const response = await fetch('/api/upload/thumbnail', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload thumbnail')
  }
  
  const data = await response.json()
  return data.url
}