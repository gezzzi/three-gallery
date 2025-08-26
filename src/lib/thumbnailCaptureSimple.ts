/**
 * シンプルなサムネイルキャプチャ（オフスクリーンレンダリング）
 */

interface CaptureOptions {
  width?: number
  height?: number
  quality?: number
  delay?: number
}

const DEFAULT_OPTIONS: CaptureOptions = {
  width: 1200,
  height: 630,
  quality: 0.9,
  delay: 5000  // 5秒待機
}

/**
 * HTMLコンテンツを実行してサムネイルをキャプチャ
 */
export async function captureHtmlThumbnailSimple(
  htmlContent: string,
  options: CaptureOptions = {}
): Promise<Blob | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve) => {
    console.log('[SimpleThumbnail] キャプチャ開始')
    
    // 非表示のiframeを作成
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.top = '-9999px'
    iframe.style.left = '-9999px'
    iframe.style.width = `${opts.width}px`
    iframe.style.height = `${opts.height}px`
    iframe.style.border = 'none'
    
    // サンドボックスを設定
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
    
    // クリーンアップ関数
    const cleanup = () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }
    
    // タイムアウト設定
    const timeoutId = setTimeout(() => {
      console.log('[SimpleThumbnail] タイムアウト')
      cleanup()
      resolve(null)
    }, opts.delay! + 5000) // delay + 5秒のタイムアウト
    
    // iframeのロードイベント
    iframe.onload = () => {
      console.log('[SimpleThumbnail] iframeロード完了')
      
      // 指定時間待機してからキャプチャを試行
      setTimeout(() => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
          
          if (!iframeDoc) {
            console.error('[SimpleThumbnail] iframeDocumentにアクセスできません')
            clearTimeout(timeoutId)
            cleanup()
            resolve(null)
            return
          }
          
          // canvas要素を探す
          const canvases = iframeDoc.getElementsByTagName('canvas')
          console.log('[SimpleThumbnail] Canvas要素数:', canvases.length)
          
          if (canvases.length === 0) {
            console.log('[SimpleThumbnail] Canvas要素が見つかりません')
            
            // 代替案: スクリーンショット用のcanvasを作成
            const captureCanvas = document.createElement('canvas')
            captureCanvas.width = opts.width!
            captureCanvas.height = opts.height!
            const ctx = captureCanvas.getContext('2d')!
            
            // iframeの内容を描画（これは制限があるかもしれない）
            ctx.fillStyle = '#1a1a1a'
            ctx.fillRect(0, 0, opts.width!, opts.height!)
            ctx.fillStyle = 'white'
            ctx.font = '48px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('Three.js Scene', opts.width! / 2, opts.height! / 2)
            
            captureCanvas.toBlob((blob) => {
              console.log('[SimpleThumbnail] 代替サムネイル生成')
              clearTimeout(timeoutId)
              cleanup()
              resolve(blob)
            }, 'image/jpeg', opts.quality)
            return
          }
          
          // 最も大きいcanvasを選択
          let targetCanvas: HTMLCanvasElement | null = null
          let maxSize = 0
          
          for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i] as HTMLCanvasElement
            const size = canvas.width * canvas.height
            console.log(`[SimpleThumbnail] Canvas ${i}: ${canvas.width}x${canvas.height}`)
            
            if (size > maxSize) {
              maxSize = size
              targetCanvas = canvas
            }
          }
          
          if (targetCanvas && targetCanvas.width > 0 && targetCanvas.height > 0) {
            console.log('[SimpleThumbnail] ターゲットCanvas選択:', targetCanvas.width, 'x', targetCanvas.height)
            
            // 新しいcanvasを作成してコピー
            const captureCanvas = document.createElement('canvas')
            captureCanvas.width = opts.width!
            captureCanvas.height = opts.height!
            const ctx = captureCanvas.getContext('2d')!
            
            // アスペクト比を保持してスケーリング
            const scale = Math.min(
              opts.width! / targetCanvas.width,
              opts.height! / targetCanvas.height
            )
            const scaledWidth = targetCanvas.width * scale
            const scaledHeight = targetCanvas.height * scale
            const offsetX = (opts.width! - scaledWidth) / 2
            const offsetY = (opts.height! - scaledHeight) / 2
            
            // 背景を塗りつぶし
            ctx.fillStyle = '#000000'
            ctx.fillRect(0, 0, opts.width!, opts.height!)
            
            // canvasの内容を描画
            ctx.drawImage(
              targetCanvas,
              0, 0, targetCanvas.width, targetCanvas.height,
              offsetX, offsetY, scaledWidth, scaledHeight
            )
            
            // Blobに変換
            captureCanvas.toBlob((blob) => {
              if (blob) {
                console.log('[SimpleThumbnail] キャプチャ成功:', blob.size, 'bytes')
              } else {
                console.log('[SimpleThumbnail] Blob生成失敗')
              }
              clearTimeout(timeoutId)
              cleanup()
              resolve(blob)
            }, 'image/jpeg', opts.quality)
          } else {
            console.log('[SimpleThumbnail] 有効なCanvasが見つかりません')
            clearTimeout(timeoutId)
            cleanup()
            resolve(null)
          }
        } catch (error) {
          console.error('[SimpleThumbnail] エラー:', error)
          clearTimeout(timeoutId)
          cleanup()
          resolve(null)
        }
      }, opts.delay!)
    }
    
    // iframeをDOMに追加
    document.body.appendChild(iframe)
    
    // HTMLコンテンツを書き込む
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()
    } else {
      console.error('[SimpleThumbnail] iframeDocumentに書き込めません')
      clearTimeout(timeoutId)
      cleanup()
      resolve(null)
    }
  })
}