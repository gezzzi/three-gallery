'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Grid, useGLTF, Html, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

interface ModelViewerProps {
  modelUrl: string
  autoRotate?: boolean
  showGrid?: boolean
  onLoad?: () => void
  onError?: (error: Error) => void
}

function Model({ url, onLoad }: { url: string; onLoad?: () => void }) {
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
  autoRotate = true, 
  showGrid = true,
  onLoad,
  onError 
}: ModelViewerProps) {
  const [error, setError] = useState<Error | null>(null)
  const [, setIsLoading] = useState(true)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = (error: Error) => {
    setError(error)
    setIsLoading(false)
    onError?.(error)
  }

  return (
    <div className="relative h-full w-full">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 2, 5]} />
        <Suspense fallback={<LoadingFallback />}>
          {error ? (
            <ErrorFallback error={error} />
          ) : (
            <>
              <Stage
                intensity={0.5}
                preset="rembrandt"
                environment="city"
              >
                <Model 
                  url={modelUrl} 
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
        <OrbitControls 
          autoRotate={autoRotate && !error}
          autoRotateSpeed={0.5}
          makeDefault
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
      
      {/* コントロールUI */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          className="rounded-lg bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-700 backdrop-blur hover:bg-white/90"
          onClick={() => {/* フルスクリーン実装 */}}
        >
          フルスクリーン
        </button>
      </div>
    </div>
  )
}