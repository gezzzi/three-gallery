'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Shield,
  Loader2,
  Check,
  X,
  ChevronRight,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  Save
} from 'lucide-react'

type SettingsTab = 'account' | 'notifications' | 'display' | 'privacy' | 'security'

interface NotificationSettings {
  emailNewFollower: boolean
  emailNewComment: boolean
  emailNewLike: boolean
  emailNewPurchase: boolean
  pushNewFollower: boolean
  pushNewComment: boolean
  pushNewLike: boolean
  pushNewPurchase: boolean
}

interface DisplaySettings {
  theme: 'light' | 'dark' | 'system'
  language: 'ja' | 'en'
  showNSFW: boolean
  autoplayVideos: boolean
  highQualityImages: boolean
}

interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private'
  showEmail: boolean
  showFollowerCount: boolean
  showFollowingCount: boolean
  allowMessages: 'everyone' | 'followers' | 'none'
  allowTagging: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Account settings
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNewFollower: true,
    emailNewComment: true,
    emailNewLike: false,
    emailNewPurchase: true,
    pushNewFollower: true,
    pushNewComment: true,
    pushNewLike: false,
    pushNewPurchase: true,
  })
  
  // Display settings
  const [display, setDisplay] = useState<DisplaySettings>({
    theme: 'light',
    language: 'ja',
    showNSFW: false,
    autoplayVideos: true,
    highQualityImages: true,
  })
  
  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showEmail: false,
    showFollowerCount: true,
    showFollowingCount: true,
    allowMessages: 'everyone',
    allowTagging: true,
  })

  useEffect(() => {
    if (authLoading) return // 認証中は何もしない
    
    if (user) {
      loadSettings()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

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
        setWebsite(profile.website || '')
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
          website,
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

      // パスワード変更
      if (newPassword && newPassword === confirmPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        })
        if (passwordError) throw passwordError
        
        // パスワードフィールドをクリア
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
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

  const handleSavePrivacy = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      // プライバシー設定を保存（将来的にDBに保存）
      localStorage.setItem('privacy_settings', JSON.stringify(privacy))
      setMessage({ type: 'success', text: 'プライバシー設定を更新しました' })
    } catch (error) {
      console.error('プライバシー設定エラー:', error)
      setMessage({ type: 'error', text: 'プライバシー設定の更新に失敗しました' })
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
          <p className="mt-4 text-gray-600">読み込み中...</p>
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
    { id: 'privacy', label: 'プライバシー', icon: Shield },
    { id: 'security', label: 'セキュリティ', icon: Lock },
  ]

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">設定</h1>

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
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100'
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
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-600 hover:bg-red-50"
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
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
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
            <div className="rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-semibold">アカウント設定</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">ユーザー名</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">表示名</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="表示名"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">自己紹介</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="自己紹介を入力..."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">ウェブサイト</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="mb-4 text-lg font-medium">パスワード変更</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">現在のパスワード</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-lg border px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">新しいパスワード</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">パスワード確認</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-lg border px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
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
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
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
            <div className="rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-semibold">通知設定</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 font-medium">メール通知</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span>新しいフォロワー</span>
                      <input
                        type="checkbox"
                        checked={notifications.emailNewFollower}
                        onChange={(e) => setNotifications({ ...notifications, emailNewFollower: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>新しいコメント</span>
                      <input
                        type="checkbox"
                        checked={notifications.emailNewComment}
                        onChange={(e) => setNotifications({ ...notifications, emailNewComment: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>新しいいいね</span>
                      <input
                        type="checkbox"
                        checked={notifications.emailNewLike}
                        onChange={(e) => setNotifications({ ...notifications, emailNewLike: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span>新しい購入</span>
                      <input
                        type="checkbox"
                        checked={notifications.emailNewPurchase}
                        onChange={(e) => setNotifications({ ...notifications, emailNewPurchase: e.target.checked })}
                        className="h-5 w-5 rounded text-blue-600"
                      />
                    </label>
                  </div>
                </div>

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
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
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
            <div className="rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-semibold">表示設定</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium">テーマ</label>
                  <select
                    value={display.theme}
                    onChange={(e) => setDisplay({ ...display, theme: e.target.value as 'light' | 'dark' | 'system' })}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="light">ライト</option>
                    <option value="dark">ダーク</option>
                    <option value="system">システム設定に従う</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">言語</label>
                  <select
                    value={display.language}
                    onChange={(e) => setDisplay({ ...display, language: e.target.value as 'ja' | 'en' })}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ja">日本語</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">NSFW コンテンツを表示</span>
                      <p className="text-sm text-gray-500">成人向けコンテンツの表示を許可します</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={display.showNSFW}
                      onChange={(e) => setDisplay({ ...display, showNSFW: e.target.checked })}
                      className="h-5 w-5 rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">動画の自動再生</span>
                      <p className="text-sm text-gray-500">フィード内の動画を自動的に再生します</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={display.autoplayVideos}
                      onChange={(e) => setDisplay({ ...display, autoplayVideos: e.target.checked })}
                      className="h-5 w-5 rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">高画質画像</span>
                      <p className="text-sm text-gray-500">より高画質な画像を読み込みます（データ使用量が増加）</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={display.highQualityImages}
                      onChange={(e) => setDisplay({ ...display, highQualityImages: e.target.checked })}
                      className="h-5 w-5 rounded text-blue-600"
                    />
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveDisplay}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
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

          {/* プライバシー設定 */}
          {activeTab === 'privacy' && (
            <div className="rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-semibold">プライバシー設定</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium">プロフィールの公開範囲</label>
                  <select
                    value={privacy.profileVisibility}
                    onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as 'public' | 'followers' | 'private' })}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="public">全体に公開</option>
                    <option value="followers">フォロワーのみ</option>
                    <option value="private">非公開</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">メッセージの受信</label>
                  <select
                    value={privacy.allowMessages}
                    onChange={(e) => setPrivacy({ ...privacy, allowMessages: e.target.value as 'everyone' | 'followers' | 'none' })}
                    className="w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="everyone">全員から受信</option>
                    <option value="followers">フォロワーのみ</option>
                    <option value="none">受信しない</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span>メールアドレスを公開</span>
                    <input
                      type="checkbox"
                      checked={privacy.showEmail}
                      onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                      className="h-5 w-5 rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span>フォロワー数を表示</span>
                    <input
                      type="checkbox"
                      checked={privacy.showFollowerCount}
                      onChange={(e) => setPrivacy({ ...privacy, showFollowerCount: e.target.checked })}
                      className="h-5 w-5 rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span>フォロー中の数を表示</span>
                    <input
                      type="checkbox"
                      checked={privacy.showFollowingCount}
                      onChange={(e) => setPrivacy({ ...privacy, showFollowingCount: e.target.checked })}
                      className="h-5 w-5 rounded text-blue-600"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span>タグ付けを許可</span>
                    <input
                      type="checkbox"
                      checked={privacy.allowTagging}
                      onChange={(e) => setPrivacy({ ...privacy, allowTagging: e.target.checked })}
                      className="h-5 w-5 rounded text-blue-600"
                    />
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePrivacy}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
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

          {/* セキュリティ設定 */}
          {activeTab === 'security' && (
            <div className="rounded-lg bg-white p-6">
              <h2 className="mb-6 text-xl font-semibold">セキュリティ設定</h2>
              
              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">二要素認証</h3>
                  <p className="mb-4 text-sm text-gray-600">
                    アカウントのセキュリティを強化するため、二要素認証を有効にすることをお勧めします。
                  </p>
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    二要素認証を設定
                  </button>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">ログインセッション</h3>
                  <p className="mb-4 text-sm text-gray-600">
                    現在アクティブなセッションを管理します。
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded border p-3">
                      <div>
                        <p className="font-medium">現在のセッション</p>
                        <p className="text-sm text-gray-500">Chrome - Windows</p>
                      </div>
                      <span className="text-sm text-green-600">アクティブ</span>
                    </div>
                  </div>
                  <button className="mt-4 text-sm text-blue-600 hover:underline">
                    他のすべてのセッションをログアウト
                  </button>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-2 font-medium">アカウントアクティビティ</h3>
                  <p className="mb-4 text-sm text-gray-600">
                    最近のログイン履歴とアカウントアクティビティ。
                  </p>
                  <button className="text-sm text-blue-600 hover:underline">
                    アクティビティログを表示
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