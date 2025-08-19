'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('[AuthContext] useEffect実行')
    // Supabaseが設定されているかチェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('[AuthContext] Supabase設定:', { supabaseUrl, supabaseKey: !!supabaseKey })
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
      // Supabase未設定の場合はモックユーザーを使用
      console.log('[AuthContext] Supabase未設定、モックユーザーを使用')
      const mockUser = {
        id: 'demo-user-001',
        email: 'demo@example.com',
        user_metadata: {
          name: 'デモユーザー',
          avatar_url: null,
        },
      } as unknown as User
      setUser(mockUser)
      setLoading(false)
      return
    }

    // 初回認証状態チェック
    console.log('[AuthContext] 認証状態チェック開始')
    checkUser()

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] 認証状態変更:', event, 'ユーザー:', session?.user?.email)
      const currentUser = session?.user || null
      setUser(currentUser)
      setLoading(false) // 認証状態変更時にloadingをfalseに
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      console.log('[AuthContext] getUser呼び出し中...')
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[AuthContext] getUser結果:', user?.email)
      setUser(user)
    } catch (error) {
      console.error('[AuthContext] Auth check error:', error)
    } finally {
      console.log('[AuthContext] loading = false に設定')
      setLoading(false)
    }
  }


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    router.push('/')
  }

  const signUp = async (email: string, password: string, username: string) => {
    // ユーザー登録
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })
    
    if (error) throw error
    
    // プロフィール作成
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        display_name: username,
      })
    }
    
    router.push('/')
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const signInWithGoogle = async () => {
    // 現在のURLのオリジンを使用（localhost/本番環境に対応）
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXT_PUBLIC_APP_URL 
        ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
        : 'http://localhost:3000/auth/callback'
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })
    
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}