import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    // クッキーから認証情報を取得
    const cookieStore = await cookies()
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // セッショントークンを取得
    const accessToken = cookieStore.get('sb-gtucwdrowzybvmviqwxb-auth-token.0')?.value
    const refreshToken = cookieStore.get('sb-gtucwdrowzybvmviqwxb-auth-token.1')?.value
    
    let user = null
    
    if (accessToken && refreshToken) {
      const { data: sessionData } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (sessionData?.session) {
        user = sessionData.session.user
      }
    } else {
      const authorization = request.headers.get('Authorization')
      const token = authorization?.replace('Bearer ', '')
      
      if (token) {
        const { data } = await supabase.auth.getUser(token)
        user = data?.user
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    
    // まず、削除対象のモデルを取得
    const { data: model, error: fetchError } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    
    if (fetchError || !model) {
      return NextResponse.json({ error: 'モデルが見つからないか、削除権限がありません' }, { status: 404 })
    }
    
    // ストレージからファイルを削除
    const deletePromises = []
    
    // 3Dモデルファイルの削除
    if (model.file_url && model.file_url.includes('storage/v1/object/public/models')) {
      const filePath = model.file_url.split('/models/')[1]
      if (filePath) {
        deletePromises.push(
          supabase.storage.from('models').remove([filePath])
        )
      }
    }
    
    // 音楽ファイルの削除
    if (model.bgm_url && model.bgm_url.includes('storage/v1/object/public/music')) {
      const musicPath = model.bgm_url.split('/music/')[1]
      if (musicPath) {
        deletePromises.push(
          supabase.storage.from('music').remove([musicPath])
        )
      }
    }
    
    // ストレージファイルを削除
    await Promise.all(deletePromises)
    
    // データベースからモデルを削除
    const { error: deleteError } = await supabase
      .from('models')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'モデルの削除に失敗しました' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'モデルを削除しました' })
    
  } catch (error) {
    console.error('Delete model error:', error)
    return NextResponse.json(
      { error: '削除処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}