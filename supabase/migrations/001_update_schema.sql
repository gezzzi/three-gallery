-- 1. modelsテーブルにupload_typeとBGM関連カラムを追加
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS upload_type TEXT DEFAULT 'model' CHECK (upload_type IN ('code', 'html', 'model')),
ADD COLUMN IF NOT EXISTS bgm_type TEXT CHECK (bgm_type IN ('default', 'upload', 'none')),
ADD COLUMN IF NOT EXISTS bgm_url TEXT,
ADD COLUMN IF NOT EXISTS bgm_name TEXT;

-- 2. 価格関連カラムを削除
ALTER TABLE models 
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS currency,
DROP COLUMN IF EXISTS is_free;

ALTER TABLE profiles
DROP COLUMN IF EXISTS stripe_customer_id;

ALTER TABLE downloads
DROP COLUMN IF EXISTS price_paid;

-- 3. transactionsテーブルを削除
DROP TABLE IF EXISTS transactions;

-- 4. commentsテーブルを追加
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

-- commentsテーブルのRLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- コメントポリシー
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- 5. updated_atトリガーをcommentsテーブルに追加
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. profilesテーブルにinsertポリシーを追加（新規ユーザー作成用）
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. modelsテーブルのupload_type用インデックス
CREATE INDEX IF NOT EXISTS idx_models_upload_type ON models(upload_type);

-- 8. modelsテーブルのBGM用インデックス
CREATE INDEX IF NOT EXISTS idx_models_bgm_type ON models(bgm_type);