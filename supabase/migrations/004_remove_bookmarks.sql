-- Remove bookmarks table and related indexes/policies
DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON bookmarks;

DROP INDEX IF EXISTS idx_bookmarks_user;
DROP INDEX IF EXISTS idx_bookmarks_model;

DROP TABLE IF EXISTS bookmarks;