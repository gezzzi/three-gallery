'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  User,
  Bell,
  Palette,
  Loader2,
  Check,
  X,
  ChevronRight,
  LogOut,
  Trash2,
  Save
} from 'lucide-react'

type SettingsTab = 'account' | 'notifications' | 'display'

interface NotificationSettings {
  pushNewFollower: boolean
  pushNewComment: boolean
  pushNewLike: boolean
  pushNewPurchase: boolean
}

interface DisplaySettings {
  theme: 'light' | 'dark' | 'system'
  language: 'ja' | 'en'
}


export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const [loading, setLoading] = useState(true) // 初期値をtrueに戻す
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Account settings
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  
  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    pushNewFollower: true,
    pushNewComment: true,
    pushNewLike: false,
    pushNewPurchase: true,
  })
  
  // Display settings
  const [display, setDisplay] = useState<DisplaySettings>({
    theme: 'light',
    language: 'ja',
  })
  

  const loadSettings = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      // Supabaseが設定されているかチェック
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        // ローカルモードの場合はデフォルト値を使用
        setEmail(user.email || '')
        setUsername(user.email?.split('@')[0] || '')
        setDisplayName(user.user_metadata?.name || user.email?.split('@')[0] || '')
        setLoading(false)
        return
      }

      // プロフィール情報を取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUsername(profile.username || '')
        setDisplayName(profile.display_name || '')
        setBio(profile.bio || '')
      }

      setEmail(user.email || '')

      // 設定情報を取得（将来的にDBから取得）
      // const { data: settings } = await supabase
      //   .from('user_settings')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .single()

    } catch (error) {
      console.error('設定の読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('[Settings] useEffect実行 - authLoading:', authLoading, 'user:', user?.email)
    
    // 認証チェック中
    if (authLoading) {
      console.log('[Settings] 認証中のためスキップ')
      setLoading(true)
      return
    }
    
    // ユーザーがいる場合
    if (user) {
      console.log('[Settings] ユーザーあり、設定を読み込み')
      loadSettings()
    } else {
      // ユーザーがいない場合
      console.log('[Settings] ユーザーなし、loading=falseに設定')
      setLoading(false)
    }
    
  }, [user, authLoading])

  const handleSaveAccount = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        // ローカルモードの場合
        setMessage({ type: 'success', text: 'アカウント情報を更新しました（ローカルモード）' })
        setSaving(false)
        return
      }

      // プロフィール更新
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          display_name: displayName,
          bio,
          updated_at: new Date().toISOString(),
        })

      if (profileError) throw profileError

      // メールアドレス変更
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        })
        if (emailError) throw emailError
      }


      setMessage({ type: 'success', text: 'アカウント情報を更新しました' })
    } catch (error) {
      console.error('アカウント更新エラー:', error)
      setMessage({ type: 'error', text: 'アカウント情報の更新に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      // 通知設定を保存（将来的にDBに保存）
      localStorage.setItem('notification_settings', JSON.stringify(notifications))
      setMessage({ type: 'success', text: '通知設定を更新しました' })
    } catch (error) {
      console.error('通知設定エラー:', error)
      setMessage({ type: 'error', text: '通知設定の更新に失敗しました' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDisplay = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      // 表示設定を保存
      localStorage.setItem('display_settings', JSON.stringify(display))
      
      // テーマを適用
      if (display.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      setMessage({ type: 'success', text: '表示設定を更新しました' })
    } catch (error) {
      console.error('表示設定エラー:', error)
      setMessage({ type: 'error', text: '表示設定の更新に失敗しました' })
    } finally {
      setSaving(false)
    }
  }


  const handleDeleteAccount = async () => {
    if (!confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) return
    
    try {
      // アカウント削除処理（実装は要検討）
      alert('アカウント削除機能は現在準備中です')
    } catch (error) {
      console.error('アカウント削除エラー:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/')
    return null
  }

  const tabs = [
    { id: 'account', label: 'アカウント', icon: User },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'display', label: '表示', icon: Palette },
  ]

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">設定</h1>

      <div className="flex gap-6">
        {/* サイドバー */}
        <div className="w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-900/20 text-blue-400 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'hover:bg-gray-700 text-gray-300 dark:hover:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight className={`ml-auto h-4 w-4 transition-transform ${
                    activeTab === tab.id ? 'rotate-90' : ''
                  }`} />
                </button>
              )
            })}
          </nav>

          <div className="mt-8 border-t pt-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-400 hover:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">ログアウト</span>
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1">
          {message && (
            <div className={`mb-4 rounded-lg p-4 ${
              message.type === 'success' ? 'bg-green-900/20 text-green-400 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-900/20 text-red-400 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
                {message.text}
              </div>
            </div>
          )}

          {/* アカウント設定 */}
          {activeTab === 'account' && (
            <div className="rounded-lg bg-gray-800 p-6 dark:bg-gray-800">
              <h2 className="mb-6 text-xl font-semibold text-gray-200 dark:text-gray-200">アカウント設定</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">ユーザー名</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">表示名</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                    placeholder="表示名"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">自己紹介</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                    placeholder="自己紹介を入力..."
                  />
                </div>



                <div className="flex justify-between">
                  <button
                    onClick={handleDeleteAccount}
                    className="rounded-lg border border-red-500 px-4 py-2 text-red-500 hover:bg-red-50"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      アカウントを削除
                    </div>
                  </button>

                  <button
                    onClick={handleSaveAccount}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-600 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-gray-600"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 通知設定 */}
          {activeTab === 'notifications' && (
            <div className="rounded-lg bg-gray-800 p-6 dark:bg-gray-800">
              <h2 className="mb-6 text-xl font-semibold text-gray-200 dark:text-gray-200">通知設定</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 font-medium">プッシュ通知</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>新しいフォロワー</span>
                      <input
                        type="checkbox"
                        checked={notifications.pushNewFollower}
                        onChange={(e) => setNotifications({ ...notifications, pushNewFollower: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>新しいコメント</span>
                      <input
                        type="checkbox"
                        checked={notifications.pushNewComment}
                        onChange={(e) => setNotifications({ ...notifications, pushNewComment: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>新しいいいね</span>
                      <input
                        type="checkbox"
                        checked={notifications.pushNewLike}
                        onChange={(e) => setNotifications({ ...notifications, pushNewLike: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>新しい購入</span>
                      <input
                        type="checkbox"
                        checked={notifications.pushNewPurchase}
                        onChange={(e) => setNotifications({ ...notifications, pushNewPurchase: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-600 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-gray-600"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 表示設定 */}
          {activeTab === 'display' && (
            <div className="rounded-lg bg-gray-800 p-6 dark:bg-gray-800">
              <h2 className="mb-6 text-xl font-semibold text-gray-200 dark:text-gray-200">表示設定</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">テーマ</label>
                  <select
                    value={display.theme}
                    onChange={(e) => setDisplay({ ...display, theme: e.target.value as 'light' | 'dark' | 'system' })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                  >
                    <option value="light">ライト</option>
                    <option value="dark">ダーク</option>
                    <option value="system">システム設定に従う</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300 dark:text-gray-300">言語</label>
                  <select
                    value={display.language}
                    onChange={(e) => setDisplay({ ...display, language: e.target.value as 'ja' | 'en' })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                  >
                    <option value="ja">日本語</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveDisplay}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-600 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-gray-600"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  )
}