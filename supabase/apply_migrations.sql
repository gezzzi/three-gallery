-- このSQLをSupabase DashboardのSQL Editorで実行してください
-- https://supabase.com/dashboard/project/gtucwdrowzybvmviqwxb/sql/new

-- ================================
-- 1. modelsテーブルの更新
-- ================================

-- upload_typeとBGM関連カラムを追加
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS upload_type TEXT DEFAULT 'model' CHECK (upload_type IN ('code', 'html', 'model')),
ADD COLUMN IF NOT EXISTS bgm_type TEXT CHECK (bgm_type IN ('default', 'upload', 'none')),
ADD COLUMN IF NOT EXISTS bgm_url TEXT,
ADD COLUMN IF NOT EXISTS bgm_name TEXT;

-- 価格関連カラムを削除
ALTER TABLE models 
DROP COLUMN IF EXISTS price CASCADE,
DROP COLUMN IF EXISTS currency CASCADE,
DROP COLUMN IF EXISTS is_free CASCADE;

-- ================================
-- 2. profilesテーブルの更新
-- ================================

ALTER TABLE profiles
DROP COLUMN IF EXISTS stripe_customer_id CASCADE,
DROP COLUMN IF EXISTS is_premium CASCADE;

-- ================================
-- 3. downloadsテーブルの更新
-- ================================

ALTER TABLE downloads
DROP COLUMN IF EXISTS price_paid CASCADE;

-- ================================
-- 4. transactionsテーブルを削除
-- ================================

DROP TABLE IF EXISTS transactions CASCADE;

-- ================================
-- 5. commentsテーブルを作成
-- ================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- commentsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_comments_model ON comments(model_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ================================
-- 6. RLSポリシーの設定
-- ================================

-- commentsテーブルのRLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- コメントポリシー
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- profilesテーブルにinsertポリシーを追加
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================
-- 7. トリガーの更新
-- ================================

-- commentsテーブルのupdated_atトリガー
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================
-- 8. インデックスの追加
-- ================================

CREATE INDEX IF NOT EXISTS idx_models_upload_type ON models(upload_type);
CREATE INDEX IF NOT EXISTS idx_models_bgm_type ON models(bgm_type);

-- ================================
-- 9. ストレージバケットの作成
-- ================================
-- 注意: ストレージバケットはSQL Editorでは作成できません。
-- Supabase Dashboard > Storage から以下のバケットを手動で作成してください：
-- 
-- 1. models (Public, 100MB制限)
-- 2. thumbnails (Public, 5MB制限)  
-- 3. avatars (Public, 5MB制限)
-- 4. audio (Public, 20MB制限)