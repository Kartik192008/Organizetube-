/*
# Add notes/calendar table for per-user notes

1. New Table
- `notes`: user notes attached to a specific date
  - id, user_id, note_date, content, created_at, updated_at

2. Security
- RLS enabled, per-user access only
*/

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  note_date date NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, note_date)
);

CREATE INDEX IF NOT EXISTS notes_user_date_idx ON notes(user_id, note_date);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_notes" ON notes;
CREATE POLICY "users_own_notes" ON notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON notes FROM anon;
