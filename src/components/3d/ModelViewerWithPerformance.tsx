'use client'

import dynamic from 'next/dynamic'

const ModelViewer = dynamic(() => import('./ModelViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">3Dビューアを読み込み中...</p>
      </div>
    </div>
  ),
})

interface ModelViewerWithPerformanceProps {
  modelUrl?: string
  htmlContent?: string
  modelType?: 'file' | 'code' | 'html'
  showPerformance?: boolean
  onPerformanceToggle?: (isShowing: boolean) => void
}

export default function ModelViewerWithPerformance({
  modelUrl,
  htmlContent,
  modelType = 'file',
  showPerformance = false,
  onPerformanceToggle
}: ModelViewerWithPerformanceProps) {

  return (
    <ModelViewer
      modelUrl={modelUrl}
      htmlContent={htmlContent}
      modelType={modelType}
      showPerformance={showPerformance}
      onPerformanceClose={() => {
        if (onPerformanceToggle) {
          onPerformanceToggle(false)
        }
      }}
    />
  )
}