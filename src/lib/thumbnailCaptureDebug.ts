/**
 * HTML Three.jsコンテンツからサムネイルをキャプチャする（デバッグ版）
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
  maxWaitTime: 10000,  // 最大10秒待機
  captureDelay: 3000   // レンダリング後3秒待機
}

/**
 * HTMLコンテンツからサムネイルを生成（デバッグ版）
 */
export async function captureHtmlThumbnailDebug(
  htmlContent: string,
  options: CaptureOptions = {}
): Promise<Blob | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  console.log('[ThumbnailDebug] キャプチャ開始 - オプション:', opts)
  
  return new Promise((resolve) => {
    let iframe: HTMLIFrameElement | null = null
    let timeoutId: NodeJS.Timeout | null = null
    let messageHandler: ((event: MessageEvent) => void) | null = null
    
    const cleanup = () => {
      console.log('[ThumbnailDebug] クリーンアップ実行')
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
      // 可視のiframeを作成（デバッグ用）
      iframe = document.createElement('iframe')
      iframe.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 400px;
        height: 300px;
        border: 2px solid red;
        z-index: 99999;
        background: white;
      `
      
      // サンドボックス設定（スクリプト実行を許可）
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin')
      
      console.log('[ThumbnailDebug] iframe作成完了')
      
      // デバッグ用のキャプチャスクリプト
      const captureScript = `
        <script>
          console.log('[IframeDebug] スクリプト開始');
          
          (function() {
            let captureAttempts = 0;
            const maxAttempts = 20;
            let debugInfo = {
              canvasFound: false,
              canvasCount: 0,
              rendererFound: false,
              canvasWidth: 0,
              canvasHeight: 0,
              errors: []
            };
            
            function sendDebugInfo() {
              parent.postMessage({
                type: 'debug-info',
                info: debugInfo
              }, '*');
            }
            
            function attemptCapture() {
              captureAttempts++;
              console.log('[IframeDebug] キャプチャ試行:', captureAttempts);
              
              try {
                // すべてのcanvas要素を探す
                const canvases = document.getElementsByTagName('canvas');
                debugInfo.canvasCount = canvases.length;
                console.log('[IframeDebug] Canvas要素数:', canvases.length);
                
                // グローバル変数をチェック
                if (typeof window.renderer !== 'undefined') {
                  debugInfo.rendererFound = true;
                  console.log('[IframeDebug] window.renderer発見');
                }
                if (typeof window.THREE !== 'undefined') {
                  console.log('[IframeDebug] THREE.js検出 - バージョン:', window.THREE.REVISION);
                }
                
                let canvas = null;
                
                // 最も大きいcanvasを選択
                if (canvases.length > 0) {
                  let maxSize = 0;
                  for (let c of canvases) {
                    const size = c.width * c.height;
                    console.log('[IframeDebug] Canvas:', c.width, 'x', c.height, 'pixels');
                    if (size > maxSize) {
                      maxSize = size;
                      canvas = c;
                    }
                  }
                  
                  if (canvas) {
                    debugInfo.canvasFound = true;
                    debugInfo.canvasWidth = canvas.width;
                    debugInfo.canvasHeight = canvas.height;
                    console.log('[IframeDebug] 最大Canvas選択:', canvas.width, 'x', canvas.height);
                  }
                }
                
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                  // canvasが有効な場合、待機してからキャプチャ
                  console.log('[IframeDebug] ${opts.captureDelay}ms待機中...');
                  
                  setTimeout(() => {
                    try {
                      console.log('[IframeDebug] toBlob実行中...');
                      
                      // まずtoDataURLを試す
                      const dataUrl = canvas.toDataURL('image/jpeg', ${opts.quality});
                      
                      if (dataUrl && dataUrl.length > 100) {
                        console.log('[IframeDebug] DataURL生成成功 - 長さ:', dataUrl.length);
                        parent.postMessage({
                          type: 'thumbnail-captured',
                          dataUrl: dataUrl
                        }, '*');
                      } else {
                        console.log('[IframeDebug] DataURL生成失敗または空');
                        debugInfo.errors.push('Empty data URL');
                        sendDebugInfo();
                        parent.postMessage({
                          type: 'thumbnail-failed',
                          reason: 'Empty canvas data'
                        }, '*');
                      }
                    } catch (e) {
                      console.error('[IframeDebug] Canvas capture error:', e);
                      debugInfo.errors.push(e.toString());
                      sendDebugInfo();
                      parent.postMessage({
                        type: 'thumbnail-failed',
                        reason: 'Canvas capture error: ' + e.message
                      }, '*');
                    }
                  }, ${opts.captureDelay});
                } else if (captureAttempts < maxAttempts) {
                  // canvasが見つからない場合、再試行
                  console.log('[IframeDebug] Canvas未検出、500ms後に再試行');
                  sendDebugInfo();
                  setTimeout(attemptCapture, 500);
                } else {
                  // 最大試行回数に達した
                  console.log('[IframeDebug] 最大試行回数到達');
                  debugInfo.errors.push('Max attempts reached');
                  sendDebugInfo();
                  parent.postMessage({
                    type: 'thumbnail-failed',
                    reason: 'Canvas not found after ' + maxAttempts + ' attempts'
                  }, '*');
                }
              } catch (error) {
                console.error('[IframeDebug] エラー:', error);
                debugInfo.errors.push(error.toString());
                if (captureAttempts < maxAttempts) {
                  setTimeout(attemptCapture, 500);
                } else {
                  sendDebugInfo();
                  parent.postMessage({
                    type: 'thumbnail-failed',
                    reason: 'Error: ' + error.message
                  }, '*');
                }
              }
            }
            
            // ページロード完了を待つ
            console.log('[IframeDebug] Document readyState:', document.readyState);
            
            if (document.readyState === 'complete') {
              console.log('[IframeDebug] ドキュメント読み込み完了、1秒後に開始');
              setTimeout(attemptCapture, 1000);
            } else {
              console.log('[IframeDebug] ドキュメント読み込み待機中...');
              window.addEventListener('load', () => {
                console.log('[IframeDebug] Loadイベント発生、1秒後に開始');
                setTimeout(attemptCapture, 1000);
              });
              
              // DOMContentLoadedも監視
              document.addEventListener('DOMContentLoaded', () => {
                console.log('[IframeDebug] DOMContentLoadedイベント発生');
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
        modifiedHtml = htmlContent + captureScript
      }
      
      console.log('[ThumbnailDebug] HTMLコンテンツサイズ:', modifiedHtml.length, 'bytes')
      
      // メッセージハンドラを設定
      messageHandler = (event: MessageEvent) => {
        console.log('[ThumbnailDebug] メッセージ受信:', event.data.type)
        
        if (event.data.type === 'debug-info') {
          console.log('[ThumbnailDebug] デバッグ情報:', event.data.info)
        } else if (event.data.type === 'thumbnail-captured' && event.data.dataUrl) {
          console.log('[ThumbnailDebug] サムネイルキャプチャ成功')
          
          // DataURLからBlobに変換
          fetch(event.data.dataUrl)
            .then(res => res.blob())
            .then(blob => {
              console.log('[ThumbnailDebug] Blob変換成功:', blob.size, 'bytes')
              resolve(blob)
              cleanup()
            })
            .catch(err => {
              console.error('[ThumbnailDebug] Blob変換エラー:', err)
              resolve(null)
              cleanup()
            })
        } else if (event.data.type === 'thumbnail-failed') {
          console.log('[ThumbnailDebug] キャプチャ失敗:', event.data.reason)
          resolve(null)
          cleanup()
        }
      }
      
      window.addEventListener('message', messageHandler)
      
      // タイムアウト設定
      timeoutId = setTimeout(() => {
        console.log('[ThumbnailDebug] タイムアウト発生')
        resolve(null)
        cleanup()
      }, opts.maxWaitTime!)
      
      // iframeをDOMに追加
      console.log('[ThumbnailDebug] iframeをDOMに追加')
      document.body.appendChild(iframe)
      
      // コンテンツを書き込む
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        console.log('[ThumbnailDebug] iframeドキュメントへの書き込み開始')
        iframeDoc.open()
        iframeDoc.write(modifiedHtml)
        iframeDoc.close()
        console.log('[ThumbnailDebug] iframeドキュメントへの書き込み完了')
      } else {
        console.error('[ThumbnailDebug] iframeドキュメントにアクセスできません')
        resolve(null)
        cleanup()
      }
      
    } catch (error) {
      console.error('[ThumbnailDebug] エラー:', error)
      resolve(null)
      cleanup()
    }
  })
}