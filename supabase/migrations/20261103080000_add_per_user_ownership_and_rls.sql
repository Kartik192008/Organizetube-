/*
# Add per-user ownership and RLS policies

1. New Columns
- `courses.user_id` (uuid, references auth.users)
- `lessons.user_id` (uuid, references auth.users)
- `study_sessions.user_id` (uuid, references auth.users)

2. Security
- Enable RLS on all three tables (re-enabling is idempotent)
- Drop old open policies that allowed anon/authenticated full access
- Create per-user policies: only the owning user can read/write their rows
- Revoke all access from the `anon` role

3. Important notes
- Existing rows keep their data but become inaccessible until assigned to a user.
- All new inserts must include `user_id` (set from `auth.uid()` on the client).
*/

ALTER TABLE courses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_courses" ON courses;
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;

DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_insert_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_update_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_delete_lessons" ON lessons;

DROP POLICY IF EXISTS "anon_select_study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "anon_insert_study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "anon_update_study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "anon_delete_study_sessions" ON study_sessions;

CREATE POLICY "users_own_courses" ON courses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_lessons" ON lessons
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_study_sessions" ON study_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON courses, lessons, study_sessions FROM anon;
