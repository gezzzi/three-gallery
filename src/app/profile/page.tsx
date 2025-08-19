'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Camera, Mail, Calendar, Edit2, Save, X, LogIn, Loader2, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { formatDate } from '@/lib/utils'
import ModelCard from '@/components/ui/ModelCard'
import { Model } from '@/types'

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
  const [loading, setLoading] = useState(true) // 初期値をtrueに戻す
  const [saving, setSaving] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [userModels, setUserModels] = useState<Model[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [editForm, setEditForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    website: '',
  })

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    console.log('[Profile] fetchProfile開始')
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

      console.log('[Profile] Supabaseクエリ開始 - user.id:', user.id)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      console.log('[Profile] Supabaseクエリ完了 - data:', data, 'error:', error)

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
      console.log('[Profile] fetchProfile完了、loading=false設定')
      setLoading(false)
    }
  }

  const fetchUserModels = async () => {
    if (!user) return
    
    try {
      // Supabaseからユーザーのモデルを取得
      const { data: supabaseModels, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'public')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching user models:', error)
        setUserModels([])
      } else if (supabaseModels) {
        // Supabaseのデータを適切な形式に変換
        const formattedModels: Model[] = supabaseModels.map(model => ({
          id: model.id,
          userId: model.user_id,
          title: model.title,
          description: model.description || '',
          thumbnailUrl: model.thumbnail_url || '/placeholder-3d.svg',
          fileUrl: model.file_url,
          previewUrl: model.preview_url,
          originalFileUrl: model.original_file_url,
          metadata: model.metadata || {},
          tags: model.tags || [],
          viewCount: model.view_count || 0,
          downloadCount: model.download_count || 0,
          likeCount: model.like_count || 0,
          createdAt: model.created_at,
          updatedAt: model.updated_at || model.created_at,
          status: model.status || 'public',
          licenseType: model.license_type || 'CC BY',
          isCommercialOk: model.is_commercial_ok || false,
          fileSize: model.file_size || 0,
          hasAnimation: model.has_animation || false,
          polygonCount: model.polygon_count,
          animationDuration: model.animation_duration,
          // BGMデータを追加
          musicType: model.bgm_type || (model.metadata?.music_type as string) || undefined,
          musicUrl: model.bgm_url || (model.metadata?.music_url as string) || undefined,
          musicName: model.bgm_name || (model.metadata?.music_name as string) || undefined
        }))
        
        setUserModels(formattedModels)
      } else {
        setUserModels([])
      }
    } catch (error) {
      console.error('Error fetching user models:', error)
      setUserModels([])
    }
  }

  useEffect(() => {
    console.log('[Profile] useEffect実行 - authLoading:', authLoading, 'user:', user?.email)
    
    // 認証チェック中
    if (authLoading) {
      console.log('[Profile] 認証中のためスキップ')
      setLoading(true)
      return
    }
    
    // ユーザーがいる場合
    if (user) {
      console.log('[Profile] ユーザーあり、プロフィールを取得')
      fetchProfile()
      fetchUserModels()
    } else {
      // ユーザーがいない場合
      console.log('[Profile] ユーザーなし、loading=falseに設定')
      setLoading(false)
    }
    
  }, [user, authLoading])
  
  // ユーザーのモデルを定期的に更新（削除後の反映のため）
  useEffect(() => {
    if (user && !loading) {
      fetchUserModels()
    }
  }, [user, loading])

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

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('この作品を削除してもよろしいですか？この操作は取り消せません。')) {
      return
    }

    setDeletingId(modelId)
    
    try {
      // セッショントークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(`/api/models/${modelId}`, {
        method: 'DELETE',
        headers,
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // 削除成功 - モデルリストから削除
        setUserModels(prev => prev.filter(m => m.id !== modelId))
        alert('作品を削除しました')
      } else {
        alert(`削除に失敗しました: ${result.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('削除中にエラーが発生しました')
    } finally {
      setDeletingId(null)
    }
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
    <div className="mx-auto max-w-6xl p-3 sm:p-6">
      {/* プロフィールヘッダー */}
      <div className="mb-4 sm:mb-8 rounded-lg bg-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* アバター */}
          <div className="relative">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-300">
              {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                <img
                  src={profile?.avatar_url || user.user_metadata?.avatar_url}
                  alt={profile?.display_name || 'ユーザー'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white text-2xl sm:text-3xl font-medium">
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
          <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">ユーザー名</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none"
                    placeholder="username"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">表示名</label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    className="w-full rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none"
                    placeholder="表示名"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">自己紹介</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none"
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
                    className="w-full rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base focus:border-blue-500 focus:outline-none"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{profile?.display_name || 'ユーザー'}</h1>
                <p className="text-sm sm:text-base text-gray-600">@{profile?.username || 'username'}</p>
                {profile?.bio && (
                  <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-700">{profile.bio}</p>
                )}
                {profile?.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm sm:text-base text-blue-600 hover:underline"
                  >
                    {profile.website}
                  </a>
                )}
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate max-w-[200px] sm:max-w-none">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    {profile?.created_at ? formatDate(profile.created_at) : '登録日不明'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 編集ボタン */}
          <div className="mt-4 sm:mt-0">
            {isEditing ? (
              <div className="flex gap-2 justify-center sm:justify-start">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1 sm:gap-2 rounded-lg bg-blue-600 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1 sm:gap-2 rounded-lg border px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium hover:bg-gray-50"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 sm:gap-2 rounded-lg border px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium hover:bg-gray-50"
              >
                <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
                編集
              </button>
            )}
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="mb-4 sm:mb-6 border-b overflow-x-auto">
        <nav className="flex gap-4 sm:gap-6 min-w-max">
          <button className="border-b-2 border-blue-600 pb-2 sm:pb-3 text-sm sm:text-base font-medium text-blue-600 whitespace-nowrap">
            アップロード ({userModels.length})
          </button>
          <button className="pb-2 sm:pb-3 text-sm sm:text-base font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
            いいね
          </button>
          <button className="pb-2 sm:pb-3 text-sm sm:text-base font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
            フォロー中
          </button>
          <button className="pb-2 sm:pb-3 text-sm sm:text-base font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap">
            フォロワー
          </button>
        </nav>
      </div>

      {/* モデル一覧 */}
      <div>
        {userModels.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {userModels.map((model) => (
              <div key={model.id} className="relative group">
                <ModelCard model={model} showUser={false} />
                <button
                  onClick={() => handleDeleteModel(model.id)}
                  disabled={deletingId === model.id}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:bg-gray-400"
                  title="削除"
                >
                  {deletingId === model.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
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