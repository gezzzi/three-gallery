import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    
    const { userId, type, title, message, data } = body

    // 必須パラメータのチェック
    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // 通知を作成
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    // キャメルケースに変換
    const formattedNotification = {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      isRead: notification.is_read,
      createdAt: notification.created_at
    }

    return NextResponse.json({ notification: formattedNotification })
  } catch (error) {
    console.error('Error in notification create:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}