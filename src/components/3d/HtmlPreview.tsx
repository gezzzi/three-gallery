'use client'

import { useEffect, useRef, useState } from 'react'

interface HtmlPreviewProps {
  htmlContent: string
  width?: string | number
  height?: string | number
  className?: string
}

export default function HtmlPreview({
  htmlContent,
  width = '100%',
  height = '500px',
  className = ''
}: HtmlPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      setIsLoading(true)
      const iframe = iframeRef.current
      
      // srcDocを使用してHTMLコンテンツを設定
      // これにより、iframeの内容が正しくレンダリングされる
      iframe.srcdoc = htmlContent
      
      // コンテンツの読み込み完了を待つ
      iframe.onload = () => {
        setIsLoading(false)
      }
    }
  }, [htmlContent])

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">コンテンツを読み込み中...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
        title="HTML Preview"
      />
    </div>
  )
}