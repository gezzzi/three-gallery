import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'

export function useFollow(targetUserId: string) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const { followingUsers, addFollowing, removeFollowing } = useStore()

  useEffect(() => {
    if (user && targetUserId) {
      checkFollowStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, targetUserId])

  const checkFollowStatus = async () => {
    if (!user) return

    // まずローカルストアをチェック
    if (followingUsers.includes(targetUserId)) {
      setIsFollowing(true)
      return
    }

    // Supabaseが設定されているかチェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
      // ローカルモードの場合はストアの状態を使用
      setIsFollowing(followingUsers.includes(targetUserId))
      return
    }

    try {
      const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single()

      setIsFollowing(!!data)
    } catch (error) {
      console.log('Follow check error:', error)
      // エラーの場合はローカルストアの状態を使用
      setIsFollowing(followingUsers.includes(targetUserId))
    }
  }

  const toggleFollow = async () => {
    if (!user) {
      alert('フォローするにはログインが必要です')
      return
    }

    setLoading(true)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        // ローカルモードの場合はストアのみ更新
        if (isFollowing) {
          removeFollowing(targetUserId)
          setIsFollowing(false)
        } else {
          addFollowing(targetUserId)
          setIsFollowing(true)
        }
        setLoading(false)
        return
      }

      if (isFollowing) {
        // アンフォロー
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)

        removeFollowing(targetUserId)
        setIsFollowing(false)
      } else {
        // フォロー
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          })

        addFollowing(targetUserId)
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Follow toggle error:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    isFollowing,
    toggleFollow,
    loading,
  }
}

export async function getFollowers(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower:profiles!follower_id(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('following_id', userId)

  if (error) throw error
  return data?.map(item => item.follower) || []
}

export async function getFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      following:profiles!following_id(
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq('follower_id', userId)

  if (error) throw error
  return data?.map(item => item.following) || []
}