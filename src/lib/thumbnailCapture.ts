/**
 * HTML Three.jsコンテンツからサムネイルをキャプチャする
 */

interface CaptureOptions {
  width?: number
  height?: number
  quality?: number
  maxWaitTime?: number
  captureDelay?: number
}

const DEFAULT_OPTIONS: CaptureOptions = {
  width: 1200,
  height: 630,
  quality: 0.9,
  maxWaitTime: 5000,  // 最大5秒待機
  captureDelay: 2000  // レンダリング後2秒待機
}

/**
 * HTMLコンテンツからサムネイルを生成
 */
export async function captureHtmlThumbnail(
  htmlContent: string,
  options: CaptureOptions = {}
): Promise<Blob | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve) => {
    let iframe: HTMLIFrameElement | null = null
    let timeoutId: NodeJS.Timeout | null = null
    let messageHandler: ((event: MessageEvent) => void) | null = null
    
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (messageHandler) {
        window.removeEventListener('message', messageHandler)
        messageHandler = null
      }
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe)
        iframe = null
      }
    }
    
    try {
      // 隠しiframeを作成
      iframe = document.createElement('iframe')
      iframe.style.cssText = `
        position: fixed;
        top: -10000px;
        left: -10000px;
        width: ${opts.width}px;
        height: ${opts.height}px;
        border: none;
        visibility: hidden;
      `
      
      // サンドボックス設定（スクリプト実行を許可）
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
      
      // キャプチャ用のスクリプトを作成（デバッグ版で成功したロジックを使用）
      const captureScript = `
        <script>
          console.log('[ThumbnailCapture] スクリプト開始');
          
          (function() {
            let captureAttempts = 0;
            const maxAttempts = 20; // 試行回数を増やす
            
            function attemptCapture() {
              captureAttempts++;
              console.log('[ThumbnailCapture] キャプチャ試行:', captureAttempts);
              
              try {
                // すべてのcanvas要素を探す
                const canvases = document.getElementsByTagName('canvas');
                console.log('[ThumbnailCapture] Canvas要素数:', canvases.length);
                
                // Three.jsの存在確認
                if (typeof window.THREE !== 'undefined') {
                  console.log('[ThumbnailCapture] THREE.js検出 - バージョン:', window.THREE.REVISION);
                }
                
                let canvas = null;
                
                // 最も大きいcanvasを選択
                if (canvases.length > 0) {
                  let maxSize = 0;
                  for (let c of canvases) {
                    const size = c.width * c.height;
                    console.log('[ThumbnailCapture] Canvas:', c.width, 'x', c.height, 'pixels');
                    if (size > maxSize) {
                      maxSize = size;
                      canvas = c;
                    }
                  }
                  
                  if (canvas) {
                    console.log('[ThumbnailCapture] 最大Canvas選択:', canvas.width, 'x', canvas.height);
                  }
                }
                
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                  // canvasが有効な場合、待機してからキャプチャ
                  console.log('[ThumbnailCapture] ${opts.captureDelay}ms待機中...');
                  
                  setTimeout(() => {
                    try {
                      console.log('[ThumbnailCapture] toDataURL実行中...');
                      
                      // toDataURLを使用（デバッグ版で成功した方法）
                      const dataUrl = canvas.toDataURL('image/jpeg', ${opts.quality});
                      
                      if (dataUrl && dataUrl.length > 100) {
                        console.log('[ThumbnailCapture] DataURL生成成功 - 長さ:', dataUrl.length);
                        parent.postMessage({
                          type: 'thumbnail-captured',
                          dataUrl: dataUrl
                        }, '*');
                      } else {
                        console.log('[ThumbnailCapture] DataURL生成失敗または空');
                        parent.postMessage({
                          type: 'thumbnail-failed',
                          reason: 'Empty canvas data'
                        }, '*');
                      }
                    } catch (e) {
                      console.error('[ThumbnailCapture] Canvas capture error:', e);
                      parent.postMessage({
                        type: 'thumbnail-failed',
                        reason: 'Canvas capture error: ' + e.message
                      }, '*');
                    }
                  }, ${opts.captureDelay});
                } else if (captureAttempts < maxAttempts) {
                  // canvasが見つからない場合、再試行
                  console.log('[ThumbnailCapture] Canvas未検出、500ms後に再試行');
                  setTimeout(attemptCapture, 500);
                } else {
                  // 最大試行回数に達した
                  console.log('[ThumbnailCapture] 最大試行回数到達');
                  parent.postMessage({
                    type: 'thumbnail-failed',
                    reason: 'Canvas not found after ' + maxAttempts + ' attempts'
                  }, '*');
                }
              } catch (error) {
                console.error('[ThumbnailCapture] エラー:', error);
                if (captureAttempts < maxAttempts) {
                  setTimeout(attemptCapture, 500);
                } else {
                  parent.postMessage({
                    type: 'thumbnail-failed',
                    reason: 'Error: ' + error.message
                  }, '*');
                }
              }
            }
            
            // ページロード完了を待つ
            console.log('[ThumbnailCapture] Document readyState:', document.readyState);
            
            if (document.readyState === 'complete') {
              console.log('[ThumbnailCapture] ドキュメント読み込み完了、1秒後に開始');
              setTimeout(attemptCapture, 1000);
            } else {
              console.log('[ThumbnailCapture] ドキュメント読み込み待機中...');
              window.addEventListener('load', () => {
                console.log('[ThumbnailCapture] Loadイベント発生、1秒後に開始');
                setTimeout(attemptCapture, 1000);
              });
            }
          })();
        </script>
      `
      
      // HTMLコンテンツの</body>タグの前にスクリプトを挿入
      let modifiedHtml = htmlContent
      if (htmlContent.includes('</body>')) {
        modifiedHtml = htmlContent.replace('</body>', `${captureScript}</body>`)
      } else if (htmlContent.includes('</html>')) {
        modifiedHtml = htmlContent.replace('</html>', `${captureScript}</html>`)
      } else {
        // bodyタグがない場合は末尾に追加
        modifiedHtml = htmlContent + captureScript
      }
      
      // メッセージハンドラを設定
      messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'thumbnail-captured' && event.data.dataUrl) {
          // DataURLからBlobに変換
          fetch(event.data.dataUrl)
            .then(res => res.blob())
            .then(blob => {
              console.log('[Thumbnail] キャプチャ成功:', blob.size, 'bytes')
              resolve(blob)
              cleanup()
            })
            .catch(err => {
              console.error('[Thumbnail] Blob変換エラー:', err)
              resolve(null)
              cleanup()
            })
        } else if (event.data.type === 'thumbnail-failed') {
          console.log('[Thumbnail] キャプチャ失敗:', event.data.reason)
          resolve(null)
          cleanup()
        }
      }
      
      window.addEventListener('message', messageHandler)
      
      // タイムアウト設定
      timeoutId = setTimeout(() => {
        console.log('[Thumbnail] タイムアウト')
        resolve(null)
        cleanup()
      }, opts.maxWaitTime!)
      
      // iframeをDOMに追加
      document.body.appendChild(iframe)
      
      // コンテンツを書き込む
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(modifiedHtml)
        iframeDoc.close()
      } else {
        console.error('[Thumbnail] iframeドキュメントにアクセスできません')
        resolve(null)
        cleanup()
      }
      
    } catch (error) {
      console.error('[Thumbnail] エラー:', error)
      resolve(null)
      cleanup()
    }
  })
}

/**
 * プレースホルダー画像を生成
 */
export async function createPlaceholderThumbnail(
  text: string = 'Three.js',
  width: number = 1200,
  height: number = 630
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  
  // グラデーション背景
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(1, '#764ba2')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  // テキスト
  ctx.fillStyle = 'white'
  ctx.font = 'bold 48px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  
  // Blobに変換
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob())
    }, 'image/jpeg', 0.9)
  })
}