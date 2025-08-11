-- コメントテーブル
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_comments_model ON comments(model_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);

-- RLSポリシー
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- コメントは誰でも見れる
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- ユーザーは自分のコメントを作成できる
CREATE POLICY "Users can create own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のコメントを更新できる
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のコメントを削除できる
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- コメント数をモデルテーブルに追加
ALTER TABLE models ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- コメント数更新トリガー
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE models SET comment_count = comment_count + 1 WHERE id = NEW.model_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE models SET comment_count = comment_count - 1 WHERE id = OLD.model_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comment_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();