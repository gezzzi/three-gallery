import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'

export function useBookmark(modelId: string) {
  const { user } = useAuth()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const { bookmarkedModels, addBookmark, removeBookmark } = useStore()

  useEffect(() => {
    if (user && modelId) {
      checkBookmarkStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, modelId])

  const checkBookmarkStatus = async () => {
    if (!user) return

    // まずローカルストアをチェック
    if (bookmarkedModels.includes(modelId)) {
      setIsBookmarked(true)
      return
    }

    // Supabaseが設定されているかチェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
      // ローカルモードの場合はストアの状態を使用
      setIsBookmarked(bookmarkedModels.includes(modelId))
      return
    }

    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('model_id', modelId)
        .single()

      setIsBookmarked(!!data)
    } catch (error) {
      console.log('Bookmark check error:', error)
      // エラーの場合はローカルストアの状態を使用
      setIsBookmarked(bookmarkedModels.includes(modelId))
    }
  }

  const toggleBookmark = async () => {
    if (!user) {
      // ログインモーダルを表示するか、アラートを出す
      alert('ブックマークするにはログインが必要です')
      return
    }

    setLoading(true)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        // ローカルモードの場合はストアのみ更新
        if (isBookmarked) {
          removeBookmark(modelId)
          setIsBookmarked(false)
        } else {
          addBookmark(modelId)
          setIsBookmarked(true)
        }
        setLoading(false)
        return
      }

      if (isBookmarked) {
        // ブックマーク解除
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('model_id', modelId)

        removeBookmark(modelId)
        setIsBookmarked(false)
      } else {
        // ブックマーク追加
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            model_id: modelId,
          })

        addBookmark(modelId)
        setIsBookmarked(true)
      }
    } catch (error) {
      console.error('Bookmark toggle error:', error)
      // エラーでもローカルの状態は更新
      if (isBookmarked) {
        removeBookmark(modelId)
        setIsBookmarked(false)
      } else {
        addBookmark(modelId)
        setIsBookmarked(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    isBookmarked,
    toggleBookmark,
    loading,
  }
}

export async function getUserBookmarks(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
    // ローカルモードの場合は空配列を返す
    return []
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        model_id,
        created_at,
        models (
          id,
          title,
          description,
          thumbnail_url,
          user_id,
          view_count,
          download_count,
          like_count,
          price,
          is_free,
          created_at,
          profiles (
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data?.map(item => item.models).filter(Boolean) || []
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return []
  }
}