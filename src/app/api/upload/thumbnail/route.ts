import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  console.log('[Thumbnail API] リクエスト受信')
  
  try {
    const supabase = await createServerClient()
    console.log('[Thumbnail API] Supabaseクライアント作成完了')
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('[Thumbnail API] 認証チェック:', { hasUser: !!user, authError })
    
    if (!user) {
      console.log('[Thumbnail API] 認証エラー: ユーザーが見つかりません')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    
    console.log('[Thumbnail API] ファイル情報:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      uploadType: type
    })

    if (!file) {
      console.log('[Thumbnail API] エラー: ファイルが提供されていません')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // ファイルタイプチェック
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // ファイル名を生成（ユーザーIDとタイムスタンプを使用）
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const thumbnailFileName = `${user.id}/${timestamp}-thumbnail.${fileExt}`
    
    console.log('[Thumbnail API] アップロード準備:', {
      thumbnailFileName,
      bucketName: 'thumbnails'
    })
    
    // ファイルをArrayBufferとして読み込む
    const arrayBuffer = await file.arrayBuffer()
    console.log('[Thumbnail API] ファイル読み込み完了:', arrayBuffer.byteLength, 'bytes')
    
    // Supabase Storageにアップロード（thumbnailsバケットを使用）
    const { error: uploadError } = await supabase.storage
      .from('thumbnails')  // 専用のthumbnailsバケットを使用
      .upload(thumbnailFileName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      const errorDetails = uploadError as unknown as Record<string, unknown>
      console.error('Upload error details:', {
        message: uploadError.message,
        status: errorDetails.statusCode || errorDetails.status,
        error: errorDetails.error
      })
      
      // バケットが存在しない場合は作成を試みる
      if (uploadError.message && uploadError.message.includes('not found')) {
        return NextResponse.json({ 
          error: 'Storage bucket not found. Please create "thumbnails" bucket in Supabase dashboard.' 
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 })
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')  // 専用のthumbnailsバケットを使用
      .getPublicUrl(thumbnailFileName)

    return NextResponse.json({ 
      url: publicUrl,
      fileName: thumbnailFileName 
    })
  } catch (error) {
    console.error('Error in thumbnail upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}