import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    
    // モデルの所有者確認
    const { data: model, error: fetchError } = await supabase
      .from('models')
      .select('user_id')
      .eq('id', id)
      .single()
    
    if (fetchError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }
    
    if (model.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // サムネイルURLの更新
    const { data: updatedModel, error: updateError } = await supabase
      .from('models')
      .update({
        thumbnail_url: body.thumbnail_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update model' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      model: updatedModel
    })
  } catch (error) {
    console.error('Error in model PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params
    
    // モデルの取得
    const { data: model, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }
    
    // 閲覧数を増やす
    await supabase
      .from('models')
      .update({ view_count: (model.view_count || 0) + 1 })
      .eq('id', id)
    
    return NextResponse.json({ model })
  } catch (error) {
    console.error('Error in model GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}