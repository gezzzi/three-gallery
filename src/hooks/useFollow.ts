import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useFollow(targetUserId: string) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && targetUserId) {
      checkFollowStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, targetUserId])

  const checkFollowStatus = async () => {
    if (!user) return

    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single()

    setIsFollowing(!!data)
  }

  const toggleFollow = async () => {
    if (!user) {
      // ログインモーダルを表示
      return
    }

    setLoading(true)

    try {
      if (isFollowing) {
        // アンフォロー
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)

        setIsFollowing(false)
      } else {
        // フォロー
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          })

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