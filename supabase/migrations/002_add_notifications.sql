-- 通知テーブル
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_follower', 'like', 'bookmark', 'download', 'new_upload', 'view_milestone', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- 関連データ（model_id, from_user_id, etc）
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLSポリシー
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ閲覧可能
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の通知の既読状態を更新可能
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- システムのみが通知を作成可能（サービスロール経由）
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- ユーザーは自分の通知を削除可能
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- 通知生成用のトリガー関数
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- フォロー時の通知トリガー
CREATE OR REPLACE FUNCTION notify_new_follower() RETURNS TRIGGER AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  -- フォロワーの名前を取得
  SELECT COALESCE(display_name, username) INTO v_follower_name
  FROM profiles
  WHERE id = NEW.follower_id;
  
  -- 通知を作成
  PERFORM create_notification(
    NEW.following_id,
    'new_follower',
    '新しいフォロワー',
    v_follower_name || 'さんがあなたをフォローしました',
    jsonb_build_object('from_user_id', NEW.follower_id, 'from_user_name', v_follower_name)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_follower
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

-- いいね時の通知トリガー
CREATE OR REPLACE FUNCTION notify_new_like() RETURNS TRIGGER AS $$
DECLARE
  v_liker_name TEXT;
  v_model_title TEXT;
  v_model_owner_id UUID;
BEGIN
  -- いいねした人の名前を取得
  SELECT COALESCE(display_name, username) INTO v_liker_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- モデルのタイトルとオーナーIDを取得
  SELECT title, user_id INTO v_model_title, v_model_owner_id
  FROM models
  WHERE id = NEW.model_id;
  
  -- 自分の作品へのいいねは通知しない
  IF v_model_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_model_owner_id,
      'like',
      '作品にいいね',
      v_liker_name || 'さんが「' || v_model_title || '」にいいねしました',
      jsonb_build_object(
        'from_user_id', NEW.user_id,
        'from_user_name', v_liker_name,
        'model_id', NEW.model_id,
        'model_title', v_model_title
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_like();

-- ブックマーク時の通知トリガー
CREATE OR REPLACE FUNCTION notify_new_bookmark() RETURNS TRIGGER AS $$
DECLARE
  v_bookmarker_name TEXT;
  v_model_title TEXT;
  v_model_owner_id UUID;
BEGIN
  -- ブックマークした人の名前を取得
  SELECT COALESCE(display_name, username) INTO v_bookmarker_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- モデルのタイトルとオーナーIDを取得
  SELECT title, user_id INTO v_model_title, v_model_owner_id
  FROM models
  WHERE id = NEW.model_id;
  
  -- 自分の作品へのブックマークは通知しない
  IF v_model_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_model_owner_id,
      'bookmark',
      '作品がブックマークされました',
      v_bookmarker_name || 'さんが「' || v_model_title || '」をブックマークしました',
      jsonb_build_object(
        'from_user_id', NEW.user_id,
        'from_user_name', v_bookmarker_name,
        'model_id', NEW.model_id,
        'model_title', v_model_title
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_bookmark
  AFTER INSERT ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_bookmark();

-- ダウンロード時の通知トリガー
CREATE OR REPLACE FUNCTION notify_new_download() RETURNS TRIGGER AS $$
DECLARE
  v_downloader_name TEXT;
  v_model_title TEXT;
  v_model_owner_id UUID;
BEGIN
  -- ダウンロードした人の名前を取得
  SELECT COALESCE(display_name, username) INTO v_downloader_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- モデルのタイトルとオーナーIDを取得
  SELECT title, user_id INTO v_model_title, v_model_owner_id
  FROM models
  WHERE id = NEW.model_id;
  
  -- 自分の作品のダウンロードは通知しない
  IF v_model_owner_id != NEW.user_id THEN
    PERFORM create_notification(
      v_model_owner_id,
      'download',
      '作品がダウンロードされました',
      v_downloader_name || 'さんが「' || v_model_title || '」をダウンロードしました',
      jsonb_build_object(
        'from_user_id', NEW.user_id,
        'from_user_name', v_downloader_name,
        'model_id', NEW.model_id,
        'model_title', v_model_title
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_download
  AFTER INSERT ON downloads
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_download();

-- 新作アップロード時の通知（フォロワーへ）
CREATE OR REPLACE FUNCTION notify_new_upload() RETURNS TRIGGER AS $$
DECLARE
  v_uploader_name TEXT;
  v_follower RECORD;
BEGIN
  -- アップロードした人の名前を取得
  SELECT COALESCE(display_name, username) INTO v_uploader_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- すべてのフォロワーに通知
  FOR v_follower IN
    SELECT follower_id
    FROM follows
    WHERE following_id = NEW.user_id
  LOOP
    PERFORM create_notification(
      v_follower.follower_id,
      'new_upload',
      'フォロー中のユーザーが新作をアップロード',
      v_uploader_name || 'さんが新作「' || NEW.title || '」をアップロードしました',
      jsonb_build_object(
        'from_user_id', NEW.user_id,
        'from_user_name', v_uploader_name,
        'model_id', NEW.id,
        'model_title', NEW.title
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_upload
  AFTER INSERT ON models
  FOR EACH ROW
  WHEN (NEW.status = 'public')
  EXECUTE FUNCTION notify_new_upload();

-- 閲覧数マイルストーン通知（10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 5000, 10000回）
CREATE OR REPLACE FUNCTION notify_view_milestone() RETURNS TRIGGER AS $$
DECLARE
  v_milestone INTEGER;
BEGIN
  -- マイルストーンのチェック
  IF OLD.view_count < 10 AND NEW.view_count >= 10 THEN
    v_milestone := 10;
  ELSIF OLD.view_count < 50 AND NEW.view_count >= 50 THEN
    v_milestone := 50;
  ELSIF OLD.view_count < 100 AND NEW.view_count >= 100 THEN
    v_milestone := 100;
  ELSIF OLD.view_count < 200 AND NEW.view_count >= 200 THEN
    v_milestone := 200;
  ELSIF OLD.view_count < 300 AND NEW.view_count >= 300 THEN
    v_milestone := 300;
  ELSIF OLD.view_count < 400 AND NEW.view_count >= 400 THEN
    v_milestone := 400;
  ELSIF OLD.view_count < 500 AND NEW.view_count >= 500 THEN
    v_milestone := 500;
  ELSIF OLD.view_count < 600 AND NEW.view_count >= 600 THEN
    v_milestone := 600;
  ELSIF OLD.view_count < 700 AND NEW.view_count >= 700 THEN
    v_milestone := 700;
  ELSIF OLD.view_count < 800 AND NEW.view_count >= 800 THEN
    v_milestone := 800;
  ELSIF OLD.view_count < 900 AND NEW.view_count >= 900 THEN
    v_milestone := 900;
  ELSIF OLD.view_count < 1000 AND NEW.view_count >= 1000 THEN
    v_milestone := 1000;
  ELSIF OLD.view_count < 5000 AND NEW.view_count >= 5000 THEN
    v_milestone := 5000;
  ELSIF OLD.view_count < 10000 AND NEW.view_count >= 10000 THEN
    v_milestone := 10000;
  ELSE
    RETURN NEW;
  END IF;
  
  -- 通知を作成
  PERFORM create_notification(
    NEW.user_id,
    'view_milestone',
    '閲覧数達成',
    '「' || NEW.title || '」が' || v_milestone || '回閲覧されました！',
    jsonb_build_object(
      'model_id', NEW.id,
      'model_title', NEW.title,
      'milestone', v_milestone,
      'current_views', NEW.view_count
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_view_milestone
  AFTER UPDATE OF view_count ON models
  FOR EACH ROW
  EXECUTE FUNCTION notify_view_milestone();