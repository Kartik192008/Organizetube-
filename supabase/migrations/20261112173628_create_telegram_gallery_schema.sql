/*
# Telegram Gallery Schema

1. Overview
This app uses Telegram as file storage backend and Supabase for metadata.
Files are uploaded to Telegram via the Bot API (through an edge function
that keeps the bot token server-side). Metadata about folders and files
is stored in Supabase.

2. New Tables
- `folders`: Organizational containers for files (nested folders supported)
- `files`: Metadata for each file stored in Telegram
- `app_settings`: Single-row table storing Telegram bot token + chat ID

3. Security
- Single-tenant app (no sign-in screen). All policies use TO anon, authenticated.
- RLS enabled on all tables. Full CRUD granted to anon + authenticated.
*/

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes bigint NOT NULL DEFAULT 0,
  telegram_message_id bigint,
  telegram_chat_id text,
  file_unique_id text,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY CHECK (id = 1),
  telegram_bot_token text,
  telegram_chat_id text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON folders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON files TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON app_settings TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_folders" ON folders;
CREATE POLICY "anon_select_folders" ON folders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_folders" ON folders;
CREATE POLICY "anon_insert_folders" ON folders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_folders" ON folders;
CREATE POLICY "anon_update_folders" ON folders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_folders" ON folders;
CREATE POLICY "anon_delete_folders" ON folders FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_files" ON files;
CREATE POLICY "anon_select_files" ON files FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_files" ON files;
CREATE POLICY "anon_insert_files" ON files FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_files" ON files;
CREATE POLICY "anon_update_files" ON files FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_files" ON files;
CREATE POLICY "anon_delete_files" ON files FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_settings" ON app_settings;
CREATE POLICY "anon_select_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON app_settings;
CREATE POLICY "anon_insert_settings" ON app_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
CREATE POLICY "anon_update_settings" ON app_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON app_settings;
CREATE POLICY "anon_delete_settings" ON app_settings FOR DELETE
  TO anon, authenticated USING (true);
