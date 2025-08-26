-- Supabase Storage Buckets Creation
-- Run this in Supabase SQL Editor

-- Create music bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'music',
  'music', 
  true, 
  false,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[];

-- Create thumbnails bucket if it doesn't exist (optional - can use music bucket instead)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[];

-- RLS policies for music bucket
CREATE POLICY "Allow authenticated users to upload music" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'music');

CREATE POLICY "Allow public to view music" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'music');

CREATE POLICY "Allow users to update their own music" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'music' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow users to delete their own music" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'music' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for thumbnails bucket (if created)
CREATE POLICY "Allow authenticated users to upload thumbnails" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Allow public to view thumbnails" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'thumbnails');

CREATE POLICY "Allow users to update their own thumbnails" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Allow users to delete their own thumbnails" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[1] = auth.uid()::text);