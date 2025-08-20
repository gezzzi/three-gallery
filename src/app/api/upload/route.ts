import { NextRequest, NextResponse } from 'next/server'
import { getDefaultBGM } from '@/lib/defaultBgm'
import { createServerClient } from '@/lib/supabase-server'

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
    
    // Supabaseクライアントの作成
    const supabase = await createServerClient()
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('[Upload API] ユーザー:', user?.email, 'エラー:', authError?.message)
    
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
    
    // サムネイル関連のデータを取得
    const thumbnailOption = formData.get('thumbnailOption') as string
    const customThumbnailUrl = formData.get('thumbnailUrl') as string | null
    
    console.log('[Upload API] 音楽データ受信:', {
      musicType,
      musicFileName: musicFile?.name,
      musicFileSize: musicFile?.size,
      selectedBgmId,
      hasMusicFile: !!musicFile
    })
    
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
      preview_url?: string
      original_file_url?: string
      thumbnail_url: string
      file_size?: number
      bgm_type?: string
      bgm_url?: string
      bgm_name?: string
      metadata: {
        type: string
        code?: string
        htmlContent?: string
        fileName?: string
        fileSize?: number
        music_id?: string
      }
    }
    
    let modelData: ModelData | null = null
    
    if (uploadType === 'code') {
      // Three.jsコードの場合
      const code = formData.get('code') as string
      modelData = {
        file_url: 'threejs-code',
        preview_url: 'threejs-code',
        thumbnail_url: customThumbnailUrl || '/placeholder-code.svg',
        file_size: new Blob([code]).size,
        metadata: {
          type: 'threejs-code',
          code: code
        }
      }
    } else if (uploadType === 'html') {
      modelData = {
        file_url: 'threejs-html',
        preview_url: 'threejs-html',
        thumbnail_url: customThumbnailUrl || '/placeholder-html.svg',
        file_size: new Blob([htmlContent]).size,
        metadata: {
          type: 'threejs-html',
          htmlContent: htmlContent
        }
      }
    } else if (uploadType === 'model') {
      // 3Dモデルファイルの処理
      const fileName = (modelFile as File)?.name || 'model.glb'
      const fileSize = (modelFile as File)?.size || 0
      
      // ファイル名をサニタイズ（特殊文字を除去）
      const sanitizedFileName = fileName
        .replace(/[^a-zA-Z0-9._-]/g, '_') // 特殊文字をアンダースコアに置換
        .replace(/_{2,}/g, '_') // 連続するアンダースコアを1つに
      
      // ファイル名をユニークにするためにタイムスタンプを追加
      const timestamp = Date.now()
      const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`
      
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
        preview_url: publicUrlData.publicUrl, // 3DモデルのプレビューURLは同じ
        original_file_url: publicUrlData.publicUrl, // オリジナルファイルURL
        thumbnail_url: customThumbnailUrl || '/placeholder-3d.svg',
        file_size: fileSize,
        metadata: {
          type: '3d-model',
          fileName: fileName,
          fileSize: fileSize
        }
      }
    }
    
    console.log('[Upload API] 音楽処理開始前のmodelData:', modelData)
    
    // 音楽ファイルの処理（直接カラムに保存）
    if (musicType === 'upload' && musicFile) {
      console.log('[Upload API] 音楽ファイルアップロード開始:', musicFile.name)
      // アップロードされた音楽ファイルの処理
      const musicFileName = musicFile.name
      
      // ファイル名をサニタイズ（特殊文字を除去）
      const sanitizedFileName = musicFileName
        .replace(/[^a-zA-Z0-9._-]/g, '_') // 特殊文字をアンダースコアに置換
        .replace(/_{2,}/g, '_') // 連続するアンダースコアを1つに
      
      // ファイル名をユニークにするためにタイムスタンプを追加
      const timestamp = Date.now()
      const uniqueMusicFileName = `${userId}/music/${timestamp}_${sanitizedFileName}`
      
      console.log('[Upload API] 音楽ファイルパス:', uniqueMusicFileName)
      
      // Supabaseストレージに音楽ファイルをアップロード
      const musicArrayBuffer = await musicFile.arrayBuffer()
      const { data: musicUploadData, error: musicUploadError } = await supabase.storage
        .from('music')
        .upload(uniqueMusicFileName, musicArrayBuffer, {
          contentType: musicFile.type || 'audio/mpeg',
          upsert: false
        })
      
      if (musicUploadError) {
        console.error('[Upload API] 音楽アップロードエラー:', musicUploadError)
        // 音楽のアップロードが失敗しても続行（オプショナル）
        if (modelData) {
          modelData.bgm_type = 'none'
        }
      } else {
        console.log('[Upload API] 音楽アップロード成功:', musicUploadData)
        // 公開URLを取得
        const { data: musicPublicUrlData } = supabase.storage
          .from('music')
          .getPublicUrl(uniqueMusicFileName)
        
        console.log('[Upload API] 音楽公開URL:', musicPublicUrlData.publicUrl)
        
        if (modelData) {
          modelData.bgm_url = musicPublicUrlData.publicUrl
          modelData.bgm_type = 'upload'
          modelData.bgm_name = musicFileName.replace(/\.[^/.]+$/, '') // 拡張子を除去
          console.log('[Upload API] modelDataにBGM情報設定:', {
            bgm_url: modelData.bgm_url,
            bgm_type: modelData.bgm_type,
            bgm_name: modelData.bgm_name
          })
        }
      }
    } else if (musicType === 'default' && selectedBgmId) {
      console.log('[Upload API] デフォルトBGM設定:', selectedBgmId)
      // デフォルトBGMの使用
      const bgm = getDefaultBGM(selectedBgmId)
      if (modelData && bgm) {
        modelData.bgm_url = bgm.url // 実際のURLを保存
        modelData.bgm_type = 'default'
        modelData.bgm_name = bgm.name
        modelData.metadata.music_id = selectedBgmId // IDはmetadataに保存
        console.log('[Upload API] デフォルトBGM設定完了:', {
          bgm_url: modelData.bgm_url,
          bgm_type: modelData.bgm_type,
          bgm_name: modelData.bgm_name
        })
      }
    } else {
      console.log('[Upload API] BGM設定なし - musicType:', musicType, 'selectedBgmId:', selectedBgmId)
      if (modelData) {
        modelData.bgm_type = 'none'
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
      modelId: model.id,
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