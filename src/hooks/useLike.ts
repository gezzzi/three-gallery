import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'

export function useLike(modelId: string) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const { likedModels, addLike, removeLike, models, updateModel } = useStore()

  useEffect(() => {
    if (modelId) {
      checkLikeStatus()
      fetchLikeCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, modelId])

  const checkLikeStatus = async () => {
    if (!user) {
      setIsLiked(false)
      return
    }

    // まずローカルストアをチェック
    if (likedModels.includes(modelId)) {
      setIsLiked(true)
      return
    }

    // Supabaseが設定されているかチェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
      // ローカルモードの場合はストアの状態を使用
      setIsLiked(likedModels.includes(modelId))
      return
    }

    try {
      const { data } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('model_id', modelId)
        .single()

      setIsLiked(!!data)
    } catch (error) {
      console.log('Like check error:', error)
      // エラーの場合はローカルストアの状態を使用
      setIsLiked(likedModels.includes(modelId))
    }
  }

  const fetchLikeCount = async () => {
    // まずローカルストアから取得
    const model = models.find(m => m.id === modelId)
    if (model) {
      setLikeCount(model.likeCount || 0)
    }

    // Supabaseが設定されているかチェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
      return
    }

    try {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('model_id', modelId)

      if (count !== null) {
        setLikeCount(count)
        // ストアのモデル更新はトグル時のみ行うため、ここでは更新しない
        // updateModel(modelId, { likeCount: count })
      }
    } catch (error) {
      console.log('Like count fetch error:', error)
    }
  }

  const toggleLike = async () => {
    if (!user) {
      // ログインモーダルを表示するか、アラートを出す
      alert('いいねするにはログインが必要です')
      return
    }

    setLoading(true)
    const previousLikeState = isLiked
    const previousLikeCount = likeCount

    // 楽観的更新
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
        // ローカルモードの場合はストアのみ更新
        if (isLiked) {
          removeLike(modelId)
          updateModel(modelId, { likeCount: likeCount - 1 })
        } else {
          addLike(modelId)
          updateModel(modelId, { likeCount: likeCount + 1 })
        }
        setLoading(false)
        return
      }

      if (isLiked) {
        // いいね解除
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('model_id', modelId)

        removeLike(modelId)
        
        // モデルのいいね数を更新
        await supabase
          .from('models')
          .update({ like_count: likeCount - 1 })
          .eq('id', modelId)
          
        updateModel(modelId, { likeCount: likeCount - 1 })
      } else {
        // いいね追加
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            model_id: modelId,
          })

        addLike(modelId)
        
        // モデルのいいね数を更新
        await supabase
          .from('models')
          .update({ like_count: likeCount + 1 })
          .eq('id', modelId)
          
        updateModel(modelId, { likeCount: likeCount + 1 })
      }
    } catch (error) {
      console.error('Like toggle error:', error)
      // エラー時は元に戻す
      setIsLiked(previousLikeState)
      setLikeCount(previousLikeCount)
      
      // ローカルストアも元に戻す
      if (previousLikeState) {
        addLike(modelId)
      } else {
        removeLike(modelId)
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    isLiked,
    toggleLike,
    loading,
    likeCount,
  }
}

export async function getUserLikedModels(userId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
    // ローカルモードの場合は空配列を返す
    return []
  }

  try {
    const { data, error } = await supabase
      .from('likes')
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
    console.error('Error fetching liked models:', error)
    return []
  }
}