'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Camera, Mail, Calendar, Edit2, Save, X, LogIn, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { formatDate } from '@/lib/utils'
import ModelCard from '@/components/ui/ModelCard'
import { Model } from '@/types'
import { useStore } from '@/store/useStore'
import { mockModels } from '@/lib/mockData'

const AuthModal = dynamic(() => import('@/components/ui/AuthModal'), { ssr: false })

interface Profile {
  id: string
  username: string
  display_name: string
  bio?: string
  website?: string
  avatar_url?: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userModels, setUserModels] = useState<Model[]>([])
  const storedModels = useStore((state) => state.models)
  
  const [editForm, setEditForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    website: '',
  })

  const fetchProfile = useCallback(async () => {
    if (!user) return
    
    try {
      // Supabaseが設定されているかチェック
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        // Supabase未設定の場合はローカルプロフィールを使用
        const localProfile: Profile = {
          id: user.id,
          username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
          bio: '3Dモデルクリエイター',
          website: '',
          avatar_url: user.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
        }
        setProfile(localProfile)
        setEditForm({
          username: localProfile.username,
          display_name: localProfile.display_name,
          bio: localProfile.bio || '',
          website: localProfile.website || '',
        })
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // プロフィールが存在しない場合は作成
        if (error.code === 'PGRST116' || error.message?.includes('not found')) {
          await createProfile()
        } else {
          // その他のエラーの場合はローカルプロフィールを使用
          console.warn('Supabase接続エラー、ローカルモードで動作します:', error.message)
          const localProfile: Profile = {
            id: user.id,
            username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
            display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
            bio: '',
            website: '',
            avatar_url: user.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
          }
          setProfile(localProfile)
          setEditForm({
            username: localProfile.username,
            display_name: localProfile.display_name,
            bio: '',
            website: '',
          })
        }
      } else if (data) {
        setProfile(data)
        setEditForm({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          website: data.website || '',
        })
      }
    } catch (error) {
      console.warn('プロフィール取得エラー:', error)
      // エラー時はローカルプロフィールを使用
      const localProfile: Profile = {
        id: user.id,
        username: user.email?.split('@')[0] || 'user',
        display_name: user.email?.split('@')[0] || 'ユーザー',
        bio: '',
        website: '',
        avatar_url: user.user_metadata?.avatar_url,
        created_at: new Date().toISOString(),
      }
      setProfile(localProfile)
      setEditForm({
        username: localProfile.username,
        display_name: localProfile.display_name,
        bio: '',
        website: '',
      })
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchUserModels = useCallback(async () => {
    if (!user) return
    
    // storeとモックデータから該当ユーザーのモデルを取得
    const allModels = [...storedModels, ...mockModels]
    const models = allModels.filter(m => m.userId === user.id)
    setUserModels(models)
  }, [user, storedModels])

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchProfile()
        fetchUserModels()
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading, fetchProfile, fetchUserModels])

  const createProfile = async () => {
    if (!user) return

    const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`
    const newProfile = {
      id: user.id,
      username,
      display_name: username,
      avatar_url: user.user_metadata?.avatar_url || null,
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      if (!error && data) {
        setProfile(data)
        setEditForm({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          website: data.website || '',
        })
      }
    } catch (error) {
      console.error('プロフィール作成エラー:', error)
    }
  }

  const handleSave = async () => {
    if (!user || !profile) return
    
    setSaving(true)
    try {
      // Supabaseが設定されているかチェック
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        // ローカルモードの場合は状態のみ更新
        setProfile({
          ...profile,
          ...editForm,
        })
        setIsEditing(false)
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          display_name: editForm.display_name,
          bio: editForm.bio,
          website: editForm.website,
        })
        .eq('id', user.id)

      if (error) {
        console.warn('プロフィール更新エラー:', error)
        // エラーでもローカル状態は更新
        setProfile({
          ...profile,
          ...editForm,
        })
        setIsEditing(false)
      } else {
        setProfile({
          ...profile,
          ...editForm,
        })
        setIsEditing(false)
      }
    } catch (error) {
      console.warn('プロフィール更新エラー:', error)
      // エラーでもローカル状態は更新
      setProfile({
        ...profile,
        ...editForm,
      })
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
      })
    }
    setIsEditing(false)
  }

  // ローディング中
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

  // 未ログイン
  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center max-w-md">
          <LogIn className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">ログインが必要です</h2>
          <p className="text-gray-600 mb-6">
            プロフィールを表示するにはログインが必要です
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            ログイン / 新規登録
          </button>
        </div>
        
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* プロフィールヘッダー */}
      <div className="mb-8 rounded-lg bg-white p-6">
        <div className="flex items-start gap-6">
          {/* アバター */}
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gray-300">
              {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user.user_metadata?.avatar_url}
                  alt={profile?.display_name || 'ユーザー'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-3xl font-medium">
                  {(profile?.display_name || user.email)?.[0].toUpperCase()}
                </div>
              )}
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100">
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* プロフィール情報 */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">ユーザー名</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">表示名</label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="表示名"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">自己紹介</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="自己紹介を入力..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">ウェブサイト</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold">{profile?.display_name || 'ユーザー'}</h1>
                <p className="text-gray-600">@{profile?.username || 'username'}</p>
                {profile?.bio && (
                  <p className="mt-3 text-gray-700">{profile.bio}</p>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-blue-600 hover:underline"
                  >
                    {profile.website}
                  </a>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {profile?.created_at ? formatDate(profile.created_at) : '登録日不明'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 編集ボタン */}
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
              >
                <Edit2 className="h-4 w-4" />
                編集
              </button>
            )}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="mb-6 border-b">
        <nav className="flex gap-6">
          <button className="border-b-2 border-blue-600 pb-3 font-medium text-blue-600">
            アップロード ({userModels.length})
          </button>
          <button className="pb-3 font-medium text-gray-600 hover:text-gray-900">
            いいね
          </button>
          <button className="pb-3 font-medium text-gray-600 hover:text-gray-900">
            フォロー中
          </button>
          <button className="pb-3 font-medium text-gray-600 hover:text-gray-900">
            フォロワー
          </button>
        </nav>
      </div>

      {/* モデル一覧 */}
      <div>
        {userModels.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {userModels.map((model) => (
              <ModelCard key={model.id} model={model} showUser={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">まだアップロードしたモデルがありません</p>
            <button
              onClick={() => router.push('/upload')}
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
            >
              最初のモデルをアップロード
            </button>
          </div>
        )}
      </div>
    </div>
  )
}