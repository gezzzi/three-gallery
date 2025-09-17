'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import type { Language } from '@/lib/translations'
import {
  User,
  Bell,
  Globe,
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


export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const { language, setLanguage, t } = useLanguage()
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
  const [displayLanguage, setDisplayLanguage] = useState<Language>(language)
  

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

      // 言語設定を読み込み
      const storedDisplay = localStorage.getItem('display_settings')
      if (storedDisplay) {
        try {
          const settings = JSON.parse(storedDisplay)
          if (settings.language) {
            setDisplayLanguage(settings.language)
          }
        } catch (e) {
          console.error('Failed to parse display settings:', e)
        }
      }

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
      console.log('[Settings] ユーザーなし、loading=falseに設定、ホームへリダイレクト')
      setLoading(false)
      router.push('/')
    }

  }, [user, authLoading, router])

  const handleSaveAccount = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage(null)
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        // ローカルモードの場合
        setMessage({ type: 'success', text: `${t.settings.messages.accountUpdated}（ローカルモード）` })
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


      setMessage({ type: 'success', text: t.settings.messages.accountUpdated })
    } catch (error) {
      console.error('アカウント更新エラー:', error)
      setMessage({ type: 'error', text: t.settings.messages.accountUpdateFailed })
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
      setMessage({ type: 'success', text: t.settings.messages.notificationsUpdated })
    } catch (error) {
      console.error('通知設定エラー:', error)
      setMessage({ type: 'error', text: t.settings.messages.notificationsUpdateFailed })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDisplay = async () => {
    setSaving(true)
    setMessage(null)

    try {
      // 表示設定を保存
      const settings = { language: displayLanguage }
      localStorage.setItem('display_settings', JSON.stringify(settings))

      // 言語をグローバルに適用
      setLanguage(displayLanguage)

      setMessage({ type: 'success', text: t.settings.messages.displayUpdated })
    } catch (error) {
      console.error('表示設定エラー:', error)
      setMessage({ type: 'error', text: t.settings.messages.displayUpdateFailed })
    } finally {
      setSaving(false)
    }
  }


  const handleDeleteAccount = async () => {
    if (!confirm(t.settings.account.deleteAccountConfirm)) return

    try {
      // アカウント削除処理（実装は要検討）
      alert(t.settings.messages.deleteAccountNotAvailable)
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
          <p className="mt-4 text-gray-400">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tabs = [
    { id: 'account', label: t.settings.tabs.account, icon: User },
    { id: 'notifications', label: t.settings.tabs.notifications, icon: Bell },
    { id: 'display', label: t.settings.tabs.display, icon: Globe },
  ]

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-100">{t.settings.title}</h1>

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
                      ? 'bg-blue-900/20 text-blue-400'
                      : 'text-gray-300 hover:bg-gray-700'
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

          <div className="mt-8 border-t border-gray-700 pt-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-400 hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">{t.common.logout}</span>
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1">
          {message && (
            <div className={`mb-4 rounded-lg p-4 ${
              message.type === 'success' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
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
            <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
              <h2 className="mb-6 text-xl font-semibold text-gray-200">{t.settings.account.title}</h2>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t.settings.account.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t.settings.account.username}</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t.settings.account.displayName}</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
                    placeholder={t.settings.account.displayName}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t.settings.account.bio}</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
                    placeholder={`${t.settings.account.bio}を入力...`}
                  />
                </div>



                <div className="flex justify-between">
                  <button
                    onClick={handleDeleteAccount}
                    className="rounded-lg border border-red-500 px-4 py-2 text-red-500 hover:bg-red-900/20"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      {t.settings.account.deleteAccount}
                    </div>
                  </button>

                  <button
                    onClick={handleSaveAccount}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-600"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t.common.save}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 通知設定 */}
          {activeTab === 'notifications' && (
            <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
              <h2 className="mb-6 text-xl font-semibold text-gray-200">{t.settings.notifications.title}</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 font-medium text-gray-200">{t.settings.notifications.push}</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-gray-300">
                      <span>{t.settings.notifications.newFollower}</span>
                      <input
                        type="checkbox"
                        checked={notifications.pushNewFollower}
                        onChange={(e) => setNotifications({ ...notifications, pushNewFollower: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between text-gray-300">
                      <span>{t.settings.notifications.newComment}</span>
                      <input
                        type="checkbox"
                        checked={notifications.pushNewComment}
                        onChange={(e) => setNotifications({ ...notifications, pushNewComment: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between text-gray-300">
                      <span>{t.settings.notifications.newLike}</span>
                      <input
                        type="checkbox"
                        checked={notifications.pushNewLike}
                        onChange={(e) => setNotifications({ ...notifications, pushNewLike: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between text-gray-300">
                      <span>{t.settings.notifications.newPurchase}</span>
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
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-600"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t.common.save}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 表示設定 */}
          {activeTab === 'display' && (
            <div className="rounded-lg bg-gray-800 p-6 border border-gray-700">
              <h2 className="mb-6 text-xl font-semibold text-gray-200">{t.settings.display.title}</h2>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">{t.settings.display.language}</label>
                  <select
                    value={displayLanguage}
                    onChange={(e) => setDisplayLanguage(e.target.value as Language)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-200 px-4 py-2 focus:border-blue-400 focus:outline-none"
                  >
                    <option value="ja">{t.settings.display.languageOptions.ja}</option>
                    <option value="en">{t.settings.display.languageOptions.en}</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveDisplay}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-600"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t.common.save}
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