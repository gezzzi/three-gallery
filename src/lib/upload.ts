import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

export interface UploadOptions {
  file: File
  userId: string
  onProgress?: (progress: number) => void
}

export async function uploadModel({ file, userId, onProgress }: UploadOptions) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${uuidv4()}.${fileExt}`
  
  // モデルファイルをアップロード
  const { data: modelData, error: modelError } = await supabase.storage
    .from('models')
    .upload(fileName, file, {
      cacheControl: '3600',
    })

  if (modelError) throw modelError

  // 公開URLを取得
  const { data: { publicUrl } } = supabase.storage
    .from('models')
    .getPublicUrl(fileName)

  return {
    fileUrl: publicUrl,
    fileName,
    fileSize: file.size,
  }
}

export async function generateThumbnail(modelUrl: string): Promise<string> {
  // サムネイル生成（実際にはEdge Functionで実装）
  // ここではプレースホルダーURLを返す
  return '/api/placeholder-thumbnail.jpg'
}

export async function processModel(modelData: {
  userId: string
  title: string
  description: string
  fileUrl: string
  thumbnailUrl: string
  tags: string[]
  licenseType: string
  isCommercialOk: boolean
  price: number
  isFree: boolean
  status: string
}) {
  // データベースにモデル情報を保存
  const { data, error } = await supabase
    .from('models')
    .insert({
      user_id: modelData.userId,
      title: modelData.title,
      description: modelData.description,
      file_url: modelData.fileUrl,
      thumbnail_url: modelData.thumbnailUrl,
      tags: modelData.tags,
      license_type: modelData.licenseType,
      is_commercial_ok: modelData.isCommercialOk,
      price: modelData.price,
      is_free: modelData.isFree,
      status: modelData.status,
      has_animation: false, // 後でファイル解析で判定
      view_count: 0,
      download_count: 0,
      like_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteModel(modelId: string, fileName: string) {
  // ストレージからファイルを削除
  const { error: storageError } = await supabase.storage
    .from('models')
    .remove([fileName])

  if (storageError) throw storageError

  // データベースから削除
  const { error: dbError } = await supabase
    .from('models')
    .delete()
    .eq('id', modelId)

  if (dbError) throw dbError
}