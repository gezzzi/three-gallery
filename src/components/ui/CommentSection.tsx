'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import { MessageCircle, Send, Edit2, Trash2 } from 'lucide-react'

interface Comment {
  id: string
  content: string
  user_id: string
  created_at: string
  updated_at: string
  edited: boolean
  user: {
    username: string
    display_name: string
    avatar_url?: string
  }
  replies?: Comment[]
}

interface CommentSectionProps {
  modelId: string
}

export default function CommentSection({ modelId }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles(username, display_name, avatar_url),
          replies:comments(
            *,
            user:profiles(username, display_name, avatar_url)
          )
        `)
        .eq('model_id', modelId)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          model_id: modelId,
          user_id: user.id,
          content: newComment.trim(),
        })

      if (error) throw error
      
      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          edited: true,
        })
        .eq('id', commentId)

      if (error) throw error
      
      setEditingId(null)
      setEditContent('')
      fetchComments()
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          model_id: modelId,
          user_id: user.id,
          parent_id: parentId,
          content: replyContent.trim(),
        })

      if (error) throw error
      
      setReplyingTo(null)
      setReplyContent('')
      fetchComments()
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      {/* アバター */}
      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-300">
        {comment.user.avatar_url ? (
          <img
            src={comment.user.avatar_url}
            alt={comment.user.username}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white">
            {comment.user.username[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* コメント本文 */}
      <div className="flex-1">
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.user.display_name || comment.user.username}</span>
              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
                {comment.edited && ' (編集済み)'}
              </span>
            </div>
            
            {user?.id === comment.user_id && (
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingId(comment.id)
                    setEditContent(comment.content)
                  }}
                  className="rounded p-1 hover:bg-gray-200"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="rounded p-1 hover:bg-gray-200"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {editingId === comment.id ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded border p-2 text-sm"
                rows={2}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleEdit(comment.id)}
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm">{comment.content}</p>
          )}
        </div>

        {!isReply && (
          <button
            onClick={() => setReplyingTo(comment.id)}
            className="mt-1 text-xs text-blue-600 hover:underline"
          >
            返信
          </button>
        )}

        {replyingTo === comment.id && (
          <div className="mt-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="返信を入力..."
              className="w-full rounded border p-2 text-sm"
              rows={2}
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => handleReply(comment.id)}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
              >
                返信
              </button>
              <button
                onClick={() => setReplyingTo(null)}
                className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 返信 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="rounded-lg bg-white p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <MessageCircle className="h-5 w-5" />
        コメント ({comments.length})
      </h3>

      {/* コメント投稿フォーム */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              className="flex-1 rounded-lg border p-3 focus:border-blue-500 focus:outline-none"
              rows={3}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-600">
            コメントを投稿するにはログインしてください
          </p>
        </div>
      )}

      {/* コメント一覧 */}
      {loading ? (
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">
          まだコメントがありません
        </p>
      )}
    </div>
  )
}