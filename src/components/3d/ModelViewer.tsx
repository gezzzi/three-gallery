'use client'

import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Grid, useGLTF, Html, PerspectiveCamera } from '@react-three/drei'
import { ErrorBoundary } from 'react-error-boundary'
import * as THREE from 'three'
import dynamic from 'next/dynamic'
import { Maximize, Minimize } from 'lucide-react'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { PerformancePanel } from '@/components/ui/PerformancePanel'

const CodeSandbox = dynamic(() => import('./CodeSandbox'), { ssr: false })
const PerformanceMonitor = dynamic(() => import('./PerformanceMonitor').then(mod => ({ default: mod.PerformanceMonitor })), { ssr: false })
const CodeEditor = dynamic(() => import('../ui/CodeEditor'), { ssr: false })
const HtmlPreview = dynamic(() => import('./HtmlPreview'), { ssr: false })

interface ModelViewerProps {
  modelUrl?: string
  code?: string
  htmlContent?: string
  modelType?: 'file' | 'code' | 'html'
  autoRotate?: boolean
  showGrid?: boolean
  showCodeEditor?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
  showPerformance?: boolean
  onPerformanceReady?: (start: () => void, stop: () => void, stats: unknown) => void
  onCanvasCreated?: (gl: THREE.WebGLRenderer, scene: THREE.Scene) => void
  onPerformanceClose?: () => void
}

function Model({ url, onLoad }: { 
  url: string; 
  onLoad?: () => void;
}) {
  const { scene, animations } = useGLTF(url)
  const mixer = useRef<THREE.AnimationMixer | null>(null)
  
  useEffect(() => {
    if (animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(scene)
      animations.forEach((clip) => {
        mixer.current?.clipAction(clip).play()
      })
    }
    onLoad?.()
  }, [scene, animations, onLoad])

  useEffect(() => {
    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction()
      }
    }
  }, [])

  return <primitive object={scene} />
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="text-sm text-gray-600">モデルを読み込み中...</p>
      </div>
    </Html>
  )
}

function ErrorFallback({ error }: { error?: Error }) {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-red-600">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">モデルの読み込みに失敗しました</p>
        {error && <p className="text-xs text-gray-500">{error.message}</p>}
      </div>
    </Html>
  )
}

export default function ModelViewer({ 
  modelUrl, 
  code,
  htmlContent,
  modelType = 'file',
  autoRotate = true, 
  showGrid = true,
  showCodeEditor = false,
  onLoad,
  onError,
  showPerformance = false,
  onCanvasCreated,
  onPerformanceClose
}: ModelViewerProps) {
  const [error, setError] = useState<Error | null>(null)
  const [, setIsLoading] = useState(true)
  const [currentCode, setCurrentCode] = useState(code || '')
  const [showEditor, setShowEditor] = useState(showCodeEditor)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadStartTime = useRef<number>(0)
  
  const {
    stats,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    setLoadMetrics
  } = usePerformanceMonitor()

  const handleLoad = useCallback(async () => {
    setIsLoading(false)
    
    // Calculate load time
    if (loadStartTime.current > 0) {
      const loadTime = performance.now() - loadStartTime.current
      
      // Estimate file size if modelUrl is available
      if (modelUrl) {
        try {
          const response = await fetch(modelUrl, { method: 'HEAD' })
          const contentLength = response.headers.get('content-length')
          const fileSizeMB = contentLength ? parseInt(contentLength) / (1024 * 1024) : 0
          setLoadMetrics(loadTime, fileSizeMB)
        } catch {
          // If HEAD request fails, just set load time
          setLoadMetrics(loadTime, 0)
        }
      } else {
        setLoadMetrics(loadTime, 0)
      }
    }
    
    onLoad?.()
  }, [modelUrl, onLoad, setLoadMetrics])
  
  // Store renderer reference
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  
  // Start/stop monitoring based on showPerformance prop
  useEffect(() => {
    if (showPerformance && rendererRef.current && sceneRef.current && !isMonitoring) {
      startMonitoring(rendererRef.current, sceneRef.current)
    } else if (!showPerformance && isMonitoring) {
      stopMonitoring()
    }
  }, [showPerformance, isMonitoring, startMonitoring, stopMonitoring])

  const handleError = (err: Error) => {
    setError(err)
    setIsLoading(false)
    onError?.(err)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch((err) => {
        console.error('Error attempting to exit fullscreen:', err)
      })
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // ファイルタイプの場合（既存の実装）
  if (!modelUrl && modelType === 'file') {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">モデルURLが指定されていません</p>
      </div>
    )
  }
  
  // HTMLタイプの場合
  if (modelType === 'html' && htmlContent) {
    return (
      <div ref={containerRef} className="relative h-full w-full bg-gray-100">
        <HtmlPreview htmlContent={htmlContent} height="100%" />
        
        {/* フルスクリーンボタン */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10">
          <button
            className="flex items-center gap-1 sm:gap-2 rounded-lg bg-white/80 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 backdrop-blur hover:bg-white/90"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <><Minimize className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">終了</span></>
            ) : (
              <><Maximize className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">フルスクリーン</span></>
            )}
          </button>
        </div>
      </div>
    )
  }

  // コード実行タイプの場合
  if (modelType === 'code' && code) {
    return (
      <div ref={containerRef} className="relative h-full w-full">
        {showEditor ? (
          <div className="flex h-full flex-col md:flex-row">
            <div className="h-1/2 md:h-full md:w-1/2">
              <CodeEditor
                initialCode={currentCode}
                onChange={setCurrentCode}
                height="100%"
                showControls={true}
                onRun={(newCode) => setCurrentCode(newCode)}
              />
            </div>
            <div className="h-1/2 md:h-full md:w-1/2">
              <CodeSandbox code={currentCode} height="100%" />
            </div>
          </div>
        ) : (
          <CodeSandbox code={currentCode} height="100%" />
        )}
        
        {/* コントロールUI */}
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10 flex flex-col sm:flex-row gap-1 sm:gap-2">
          <button
            className="rounded-lg bg-white/80 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 backdrop-blur hover:bg-white/90"
            onClick={() => setShowEditor(!showEditor)}
          >
            {showEditor ? 'プレビューのみ' : 'エディタを表示'}
          </button>
          <button
            className="flex items-center gap-1 sm:gap-2 rounded-lg bg-white/80 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 backdrop-blur hover:bg-white/90"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <><Minimize className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">終了</span></>
            ) : (
              <><Maximize className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">フルスクリーン</span></>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas 
        shadows
        onCreated={({ gl, scene }) => {
          rendererRef.current = gl as THREE.WebGLRenderer
          sceneRef.current = scene
          if (onCanvasCreated) {
            onCanvasCreated(gl as THREE.WebGLRenderer, scene)
          }
          // Start monitoring if showPerformance is already true
          if (showPerformance) {
            setTimeout(() => {
              startMonitoring(gl as THREE.WebGLRenderer, scene)
            }, 100)
          }
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />
        <ErrorBoundary
          fallbackRender={({ error: err }) => <ErrorFallback error={err} />}
          onError={handleError}
        >
          <Suspense fallback={<LoadingFallback />}>
            {error ? (
              <ErrorFallback error={error} />
            ) : (
              <>
                {/* Performance monitoring component */}
                {showPerformance && isMonitoring && PerformanceMonitor && (
                  <PerformanceMonitor onUpdate={() => {
                    // Force update stats
                    if (rendererRef.current && sceneRef.current) {
                      // Stats will be updated by the hook's animation loop
                    }
                  }} />
                )}
                <Stage
                  intensity={0.5}
                  preset="rembrandt"
                  environment="city"
                >
                  <Model 
                    url={modelUrl!} 
                    onLoad={handleLoad}
                  />
                </Stage>
                {showGrid && (
                  <Grid
                    args={[10, 10]}
                    cellSize={0.5}
                    cellThickness={0.5}
                    cellColor={'#6b7280'}
                    sectionSize={3}
                    sectionThickness={1}
                    sectionColor={'#9ca3af'}
                    fadeDistance={30}
                    fadeStrength={1}
                    followCamera={false}
                  />
                )}
              </>
            )}
          </Suspense>
        </ErrorBoundary>
        <OrbitControls 
          autoRotate={autoRotate && !error}
          autoRotateSpeed={0.5}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
      
      {/* コントロールUI */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex gap-2">
        <button
          className="flex items-center gap-1 sm:gap-2 rounded-lg bg-white/80 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 backdrop-blur hover:bg-white/90"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <><Minimize className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">終了</span></>
          ) : (
            <><Maximize className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">フルスクリーン</span></>
          )}
        </button>
      </div>
      
      {/* Performance Panel - Inside ModelViewer for fullscreen compatibility */}
      {showPerformance && (
        <PerformancePanel
          stats={stats}
          isVisible={showPerformance}
          onClose={() => {
            if (isMonitoring) {
              stopMonitoring()
            }
            if (onPerformanceClose) {
              onPerformanceClose()
            }
          }}
        />
      )}
    </div>
  )
}