-- musicバケットに画像MIMEタイプを追加
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- 音楽ファイル
  'audio/mpeg', 
  'audio/wav', 
  'audio/ogg', 
  'audio/mp4', 
  'audio/webm',
  -- 画像ファイル（サムネイル用）
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp',
  'image/gif'
]::text[]
WHERE id = 'music';

-- または、専用のthumbnailsバケットを作成
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;