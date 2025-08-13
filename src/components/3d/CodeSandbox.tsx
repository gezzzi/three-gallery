'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'

interface CodeSandboxProps {
  code: string
  width?: string | number
  height?: string | number
  className?: string
}

const SANDBOX_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; }
    canvas { display: block; }
    #error {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      background: #ff0000dd;
      color: white;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      display: none;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div id="error"></div>
  <script src="https://unpkg.com/three@0.179.0/build/three.min.js"></script>
  <script src="https://unpkg.com/three@0.179.0/examples/js/controls/OrbitControls.js"></script>
  <script>
    // エラーハンドリング
    window.addEventListener('error', function(e) {
      const errorDiv = document.getElementById('error');
      errorDiv.style.display = 'block';
      errorDiv.textContent = e.message + ' (Line: ' + e.lineno + ')';
      console.error(e);
    });

    // セキュリティ: 危険なAPIを無効化
    const blockedAPIs = [
      'XMLHttpRequest', 'fetch', 'WebSocket', 'EventSource',
      'localStorage', 'sessionStorage', 'indexedDB',
      'open', 'alert', 'confirm', 'prompt'
    ];
    
    blockedAPIs.forEach(api => {
      if (api in window) {
        window[api] = function() {
          throw new Error(api + ' is not allowed in sandbox');
        };
      }
    });

    // Three.js基本セットアップ
    let scene, camera, renderer, controls;
    let animationId;
    let userAnimate = null; // ユーザー定義のアニメーション関数

    function initThree() {
      // シーン作成
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // カメラ作成
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(5, 5, 5);

      // レンダラー作成
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      document.body.appendChild(renderer.domElement);

      // コントロール
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // ライト
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // グリッド
      const gridHelper = new THREE.GridHelper(10, 10);
      scene.add(gridHelper);

      // リサイズ対応
      window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      animationId = requestAnimationFrame(animate);
      controls.update();
      
      // ユーザーのアニメーション関数を呼ぶ
      if (typeof userAnimate === 'function') {
        userAnimate();
      }
      
      renderer.render(scene, camera);
    }

    function cleanup() {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      // シーンのクリーンアップ
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    }

    // ユーザーコード実行
    function runUserCode(code) {
      try {
        // 既存のアニメーションをクリア
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        
        // シーンをクリア（グリッドとライトは残す）
        const toRemove = [];
        scene.traverse((child) => {
          if (child.type !== 'GridHelper' && 
              child.type !== 'AmbientLight' && 
              child.type !== 'DirectionalLight') {
            toRemove.push(child);
          }
        });
        toRemove.forEach(child => scene.remove(child));
        
        // ユーザーアニメーション関数をリセット
        userAnimate = null;
        
        // ユーザーコードを実行（userAnimateをグローバルに定義できるようにする）
        const wrappedCode = \`
          (function() {
            \${code}
          })();
        \`;
        eval(wrappedCode);
        
        // アニメーション再開
        animate();
      } catch (error) {
        const errorDiv = document.getElementById('error');
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Error: ' + error.message;
        console.error(error);
      }
    }

    // 初期化
    initThree();
    animate();

    // 親ウィンドウからのメッセージを受信
    window.addEventListener('message', function(event) {
      if (event.data.type === 'RUN_CODE') {
        document.getElementById('error').style.display = 'none';
        runUserCode(event.data.code);
      }
    });

    // 準備完了を通知
    window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');
  </script>
</body>
</html>
`

export default function CodeSandbox({
  code,
  width = '100%',
  height = '400px',
  className = ''
}: CodeSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SANDBOX_READY') {
        setIsReady(true)
      } else if (event.data.type === 'SANDBOX_ERROR') {
        setError(event.data.error)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  useEffect(() => {
    if (isReady && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        { type: 'RUN_CODE', code },
        '*'
      )
    }
  }, [code, isReady])

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-red-500 text-white p-2 rounded-md flex items-center gap-2 z-10">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={SANDBOX_HTML}
        className="w-full h-full border-0"
        sandbox="allow-scripts"
        title="Three.js Code Sandbox"
      />
    </div>
  )
}