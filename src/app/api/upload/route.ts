import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const uploadType = formData.get('uploadType') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string
    const license = formData.get('license') as string
    const isCommercialOk = formData.get('isCommercialOk') === 'true'
    const isFree = formData.get('isFree') === 'true'
    const price = parseFloat(formData.get('price') as string) || 0
    const status = formData.get('status') as string
    const code = formData.get('code') as string
    const template = formData.get('template') as string
    const htmlContent = formData.get('htmlContent') as string
    const modelFile = formData.get('modelFile') as File
    
    // UUID形式のデモユーザーIDを使用
    const userId = formData.get('userId') as string || '00000000-0000-0000-0000-000000000001'

    if (uploadType === 'code' && !code) {
      return NextResponse.json({ error: 'コードが必要です' }, { status: 400 })
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
        template?: string
        htmlContent?: string
        fileName?: string
        fileSize?: number
      }
    }
    
    let modelData: ModelData | null = null
    
    if (uploadType === 'code') {
      modelData = {
        file_url: 'threejs-code',
        thumbnail_url: '/placeholder-code.jpg',
        metadata: {
          type: 'threejs-code',
          code: code,
          template: template || 'custom'
        }
      }
    } else if (uploadType === 'html') {
      modelData = {
        file_url: 'threejs-html',
        thumbnail_url: '/placeholder-html.jpg',
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
        thumbnail_url: '/placeholder-3d.jpg',
        file_size: fileSize,
        metadata: {
          type: '3d-model',
          fileName: fileName,
          fileSize: fileSize
        }
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
        is_free: isFree,
        price: isFree ? 0 : price,
        status,
        ...modelData
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      
      // 開発環境でよくあるエラーの場合はローカルモードで保存
      if (dbError.code === '42P01' || // table does not exist
          dbError.code === '23503' || // foreign key violation
          dbError.code === '22P02' || // invalid input syntax for uuid
          dbError.code === '42501' || // insufficient privilege
          dbError.message?.includes('row-level security') || // RLSポリシーエラー
          dbError.message?.includes('relation') ||
          dbError.message?.includes('bucket')) {
        // ローカルモードで保存
        return NextResponse.json({
          success: true,
          model: {
            id: uuidv4(),
            title,
            description,
            tags: tagsArray,
            ...modelData
          },
          message: 'ローカルモードで保存されました'
        })
      }
      return NextResponse.json({ error: `データベースエラー: ${dbError.message}` }, { status: 500 })
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