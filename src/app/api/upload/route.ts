import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDefaultBGM } from '@/lib/defaultBgm'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('[Upload API] リクエスト受信')
  try {
    // 環境変数をチェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('[Upload API] Supabase設定:', { supabaseUrl, hasKey: !!supabaseKey })
    
    // Supabaseが設定されていない場合はローカルモードで動作
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
      const formData = await request.formData()
      // ローカルモードでの処理を続行
      return NextResponse.json({ 
        success: true, 
        model: {
          id: Math.random().toString(36).substr(2, 9),
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          // その他の必要なフィールド
        }
      })
    }
    
    // クッキーから認証情報を取得
    const cookieStore = await cookies()
    
    // Supabaseクライアントの作成
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // クッキーからセッショントークンを取得して設定
    const accessToken = cookieStore.get('sb-gtucwdrowzybvmviqwxb-auth-token.0')?.value
    const refreshToken = cookieStore.get('sb-gtucwdrowzybvmviqwxb-auth-token.1')?.value
    
    console.log('[Upload API] トークン取得:', !!accessToken, !!refreshToken)
    
    let user = null
    let authError = null
    
    if (accessToken && refreshToken) {
      // セッションを設定
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (sessionData?.session) {
        user = sessionData.session.user
        console.log('[Upload API] セッション設定成功:', user?.email)
      } else {
        authError = sessionError
      }
    } else {
      // Authorizationヘッダーからトークンを取得
      const authorization = request.headers.get('Authorization')
      const token = authorization?.replace('Bearer ', '')
      
      if (token) {
        const { data, error } = await supabase.auth.getUser(token)
        user = data?.user
        authError = error
      } else {
        authError = new Error('認証情報が見つかりません')
      }
    }
    
    console.log('[Upload API] 最終的なユーザー:', user?.email, 'エラー:', authError?.message)
    
    if (authError || !user) {
      console.error('[Upload API] 認証エラー:', authError)
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
        code?: string
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
    
    if (uploadType === 'code') {
      // Three.jsコードの場合
      const code = formData.get('code') as string
      modelData = {
        file_url: 'threejs-code',
        thumbnail_url: '/placeholder-code.svg',
        metadata: {
          type: 'threejs-code',
          code: code
        }
      }
    } else if (uploadType === 'html') {
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
      const fileName = (modelFile as File)?.name || 'model.glb'
      const fileSize = (modelFile as File)?.size || 0
      
      // ファイル名をユニークにするためにタイムスタンプを追加
      const timestamp = Date.now()
      const uniqueFileName = `${userId}/${timestamp}_${fileName}`
      
      // Supabaseストレージにファイルをアップロード
      const arrayBuffer = await modelFile.arrayBuffer()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('models')
        .upload(uniqueFileName, arrayBuffer, {
          contentType: modelFile.type || 'model/gltf-binary',
          upsert: false
        })
      
      if (uploadError) {
        console.error('Model upload error:', uploadError)
        return NextResponse.json({ 
          error: `モデルファイルのアップロードに失敗しました: ${uploadError.message}` 
        }, { status: 500 })
      }
      
      // 公開URLを取得
      const { data: publicUrlData } = supabase.storage
        .from('models')
        .getPublicUrl(uniqueFileName)
      
      modelData = {
        file_url: publicUrlData.publicUrl,
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
      const musicFileName = musicFile.name
      
      // ファイル名をユニークにするためにタイムスタンプを追加
      const timestamp = Date.now()
      const uniqueMusicFileName = `${userId}/music/${timestamp}_${musicFileName}`
      
      // Supabaseストレージに音楽ファイルをアップロード
      const musicArrayBuffer = await musicFile.arrayBuffer()
      const { data: musicUploadData, error: musicUploadError } = await supabase.storage
        .from('music')
        .upload(uniqueMusicFileName, musicArrayBuffer, {
          contentType: musicFile.type || 'audio/mpeg',
          upsert: false
        })
      
      if (musicUploadError) {
        console.error('Music upload error:', musicUploadError)
        // 音楽のアップロードが失敗しても続行（オプショナル）
        if (modelData) {
          modelData.metadata.music_type = 'none'
        }
      } else {
        // 公開URLを取得
        const { data: musicPublicUrlData } = supabase.storage
          .from('music')
          .getPublicUrl(uniqueMusicFileName)
        
        if (modelData) {
          modelData.metadata.music_url = musicPublicUrlData.publicUrl
          modelData.metadata.music_type = 'upload'
          modelData.metadata.music_name = musicFileName.replace(/\.[^/.]+$/, '') // 拡張子を除去
        }
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

    // 挿入するデータを構築
    const insertData = {
      user_id: userId,
      title,
      description,
      tags: tagsArray,
      license_type: license,
      is_commercial_ok: isCommercialOk,
      status,
      upload_type: uploadType,
      ...modelData
    }
    
    console.log('[Upload API] 挿入データ:', {
      ...insertData,
      metadata: JSON.stringify(insertData.metadata)
    })
    console.log('[Upload API] 現在のユーザーID:', userId)
    console.log('[Upload API] auth.uid()の確認用:', user.id)
    
    // データベースに保存
    const { data: model, error: dbError } = await supabase
      .from('models')
      .insert(insertData)
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