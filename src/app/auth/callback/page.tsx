'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URLのハッシュフラグメントからコードを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        
        if (accessToken) {
          // セッションが確立されるまで待つ
          const { data: { user }, error } = await supabase.auth.getUser(accessToken)
          
          if (error) {
            console.error('認証エラー:', error)
            router.push('/')
            return
          }

          if (user) {
            console.log('認証成功:', user.email)
            // 認証成功後、元のページまたはホームページにリダイレクト
            const returnUrl = localStorage.getItem('authReturnUrl') || '/'
            localStorage.removeItem('authReturnUrl')
            router.push(returnUrl)
          }
        } else {
          // エラーをチェック
          const error = hashParams.get('error')
          const errorDescription = hashParams.get('error_description')
          
          if (error) {
            console.error('OAuth エラー:', error, errorDescription)
          }
          
          // エラーの場合もホームページにリダイレクト
          router.push('/')
        }
      } catch (error) {
        console.error('コールバック処理エラー:', error)
        router.push('/')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">認証処理中...</p>
      </div>
    </div>
  )
}