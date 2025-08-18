import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getDefaultBGM } from '@/lib/defaultBgm'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Supabaseクライアントの作成（認証付き）
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string) {
            cookieStore.delete(name)
          },
        },
      }
    )
    
    // 現在のユーザーを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }
    const formData = await request.formData()
    const uploadType = formData.get('uploadType') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string
    const license = formData.get('license') as string
    const isCommercialOk = formData.get('isCommercialOk') === 'true'
    const status = formData.get('status') as string
    const htmlContent = formData.get('htmlContent') as string
    const modelFile = formData.get('modelFile') as File
    
    // 音楽関連のデータを取得
    const musicType = formData.get('musicType') as string
    const musicFile = formData.get('musicFile') as File | null
    const selectedBgmId = formData.get('selectedBgmId') as string
    
    // 認証されたユーザーIDを使用
    const userId = user.id
    
    // プロファイルが存在するか確認し、存在しない場合は作成
    const { error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError && profileError.code === 'PGRST116') {
      // プロファイルが存在しない場合は作成
      const username = user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: username,
          display_name: username,
          avatar_url: user.user_metadata?.avatar_url || null
        })
      
      if (insertError) {
        console.error('Profile creation error:', insertError)
        return NextResponse.json({ error: 'プロファイルの作成に失敗しました' }, { status: 500 })
      }
    }

    if (uploadType === 'html' && !htmlContent) {
      return NextResponse.json({ error: 'HTMLコンテンツが必要です' }, { status: 400 })
    }
    
    if (uploadType === 'model' && !modelFile) {
      return NextResponse.json({ error: '3Dモデルファイルが必要です' }, { status: 400 })
    }

    // タグを配列に変換
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

    // アップロードタイプに応じたデータ作成
    interface ModelData {
      file_url: string
      thumbnail_url: string
      file_size?: number
      metadata: {
        type: string
        htmlContent?: string
        fileName?: string
        fileSize?: number
        music_url?: string
        music_type?: string
        music_name?: string
        music_id?: string
      }
    }
    
    let modelData: ModelData | null = null
    
    if (uploadType === 'html') {
      modelData = {
        file_url: 'threejs-html',
        thumbnail_url: '/placeholder-html.svg',
        metadata: {
          type: 'threejs-html',
          htmlContent: htmlContent
        }
      }
    } else if (uploadType === 'model') {
      // 3Dモデルファイルの処理
      // 通常はファイルをストレージにアップロードしてURLを取得しますが、
      // ここではデモ用にローカルのURLを使用します
      const fileName = (modelFile as File)?.name || 'model.glb'
      const fileSize = (modelFile as File)?.size || 0
      
      modelData = {
        file_url: `/models/${fileName}`, // デモ用のURL
        thumbnail_url: '/placeholder-3d.svg',
        file_size: fileSize,
        metadata: {
          type: '3d-model',
          fileName: fileName,
          fileSize: fileSize
        }
      }
    }
    
    // 音楽ファイルの処理（metadataに保存）
    if (musicType === 'upload' && musicFile) {
      // アップロードされた音楽ファイルの処理
      // 通常はストレージにURLをアップロードしてURLを取得しますが、
      // ここではデモ用にローカルのURLを使用します
      const musicFileName = musicFile.name
      if (modelData) {
        modelData.metadata.music_url = `/music/${musicFileName}` // デモ用のURL
        modelData.metadata.music_type = 'upload'
        modelData.metadata.music_name = musicFileName.replace(/\.[^/.]+$/, '') // 拡張子を除去
      }
    } else if (musicType === 'default' && selectedBgmId) {
      // デフォルトBGMの使用
      const bgm = getDefaultBGM(selectedBgmId)
      if (modelData && bgm) {
        modelData.metadata.music_url = bgm.url // 実際のURLを保存
        modelData.metadata.music_type = 'default'
        modelData.metadata.music_name = bgm.name
        modelData.metadata.music_id = selectedBgmId // IDも保存
      }
    }

    // データベースに保存
    const { data: model, error: dbError } = await supabase
      .from('models')
      .insert({
        user_id: userId,
        title,
        description,
        tags: tagsArray,
        license_type: license,
        is_commercial_ok: isCommercialOk,
        status,
        ...modelData
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error details:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        modelData
      })
      
      return NextResponse.json({ 
        error: `データベースエラー: ${dbError.message}`,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      model,
      message: 'アップロードが完了しました'
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'アップロード処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}