'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [error, setError] = useState('')
  const { signInWithGoogle } = useAuth()
  const { t } = useLanguage()

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    try {
      // 現在のページを記憶（ログイン後に戻るため）
      if (typeof window !== 'undefined') {
        localStorage.setItem('authReturnUrl', window.location.pathname)
      }
      await signInWithGoogle()
      // OAuthの場合はリダイレクトされるため、モーダルは閉じない
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.auth.googleLoginFailed
      setError(errorMessage)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-gray-800 p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-gray-700 text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-100 text-center">
          {t.auth.loginSignupTitle}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          <p className="text-gray-400">
            {t.auth.loginWithGoogleDesc}
          </p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 bg-gray-700 py-3 font-medium text-gray-200 hover:bg-gray-600"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t.auth.loginWithGoogle}
        </button>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {t.auth.loginAgreement}
          </p>
        </div>
      </div>
    </div>
  )
}