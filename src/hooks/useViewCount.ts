import { useState, useEffect } from 'react'

export function useViewCount(modelId: string | undefined, initialCount: number = 0) {
  const [viewCount, setViewCount] = useState(initialCount)
  const [hasIncremented, setHasIncremented] = useState(false)

  useEffect(() => {
    const incrementViewCount = async () => {
      if (!modelId) return

      // セッションストレージを使用して同じセッションでの重複カウントを防ぐ
      const viewedKey = `viewed_${modelId}`
      const hasViewed = sessionStorage.getItem(viewedKey)

      if (!hasViewed && !hasIncremented) {
        try {
          const response = await fetch(`/api/models/${modelId}/views`, {
            method: 'POST',
          })

          if (response.ok) {
            const data = await response.json()
            setViewCount(data.viewCount)
            sessionStorage.setItem(viewedKey, 'true')
            setHasIncremented(true)
          }
        } catch (error) {
          console.error('Failed to increment view count:', error)
        }
      }
    }

    // 少し遅延させてからカウントを増やす（ボットや誤クリックを防ぐため）
    const timer = setTimeout(() => {
      incrementViewCount()
    }, 2000)

    return () => clearTimeout(timer)
  }, [modelId, hasIncremented])

  // 初期カウントが更新されたら反映
  useEffect(() => {
    if (initialCount > 0 && viewCount === 0) {
      setViewCount(initialCount)
    }
  }, [initialCount])

  return { viewCount, setViewCount }
}