/**
 * 簡略化されたサムネイル生成ユーティリティ
 * 最初のフレームを素早くキャプチャする
 */

interface SimpleThumbnailOptions {
  width?: number
  height?: number
  quality?: number
  delay?: number // レンダリング待機時間
}

const DEFAULT_OPTIONS: SimpleThumbnailOptions = {
  width: 1200,
  height: 630,
  quality: 0.8,
  delay: 1000 // 1秒待機
}

/**
 * HTMLコンテンツから簡易サムネイルを生成
 * canvas要素を探して最初のフレームをキャプチャ
 */
export async function generateSimpleHtmlThumbnail(
  htmlContent: string,
  options: SimpleThumbnailOptions = {}
): Promise<Blob | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve) => {
    try {
      // iframeを作成
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.left = '-10000px'
      iframe.style.width = `${opts.width}px`
      iframe.style.height = `${opts.height}px`
      iframe.sandbox.add('allow-scripts')
      iframe.sandbox.add('allow-same-origin')
      
      // キャプチャ用のスクリプトを挿入
      const captureScript = `
        <script>
          setTimeout(() => {
            try {
              // Three.jsのrendererまたはcanvas要素を探す
              let canvas = null;
              
              if (typeof renderer !== 'undefined' && renderer.domElement) {
                canvas = renderer.domElement;
              } else {
                canvas = document.querySelector('canvas');
              }
              
              if (canvas) {
                // canvasから画像データを取得
                const dataUrl = canvas.toDataURL('image/jpeg', ${opts.quality});
                parent.postMessage({
                  type: 'thumbnail-captured',
                  dataUrl: dataUrl
                }, '*');
              } else {
                // canvasが見つからない場合はnullを返す
                parent.postMessage({
                  type: 'thumbnail-failed',
                  reason: 'No canvas found'
                }, '*');
              }
            } catch (error) {
              parent.postMessage({
                type: 'thumbnail-failed',
                reason: error.message
              }, '*');
            }
          }, ${opts.delay});
        </script>
      `
      
      // HTMLコンテンツにスクリプトを追加
      const modifiedHtml = htmlContent.replace('</body>', `${captureScript}</body>`)
      
      // メッセージリスナー
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'thumbnail-captured') {
          // DataURLからBlobに変換
          fetch(event.data.dataUrl)
            .then(res => res.blob())
            .then(blob => {
              resolve(blob)
              cleanup()
            })
            .catch(() => {
              resolve(null)
              cleanup()
            })
        } else if (event.data.type === 'thumbnail-failed') {
          console.log('Thumbnail generation failed:', event.data.reason)
          resolve(null)
          cleanup()
        }
      }
      
      const cleanup = () => {
        window.removeEventListener('message', handleMessage)
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
      }
      
      window.addEventListener('message', handleMessage)
      
      // iframeをドキュメントに追加
      document.body.appendChild(iframe)
      
      // HTMLを書き込む
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(modifiedHtml)
        iframeDoc.close()
      } else {
        resolve(null)
        cleanup()
      }
      
      // タイムアウト（3秒）
      setTimeout(() => {
        resolve(null)
        cleanup()
      }, 3000)
      
    } catch (error) {
      console.error('Simple thumbnail generation error:', error)
      resolve(null)
    }
  })
}

