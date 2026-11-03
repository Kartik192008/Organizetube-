/*
# Create Organizer study tables (single-tenant, no sign-in)

1. New Tables
- `courses`: a saved YouTube video or playlist that the user wants to study.
  - `id`, `title`, `source_url`, `source_kind` ('video' or 'playlist'), `thumbnail_url`, `created_at`
- `lessons`: each individual video inside a course, in order.
  - `id`, `course_id` (cascades on course delete), `youtube_id`, `title`, `position`, `completed`, `completed_at`, `created_at`
- `study_sessions`: a log of study time, used for streaks and weekly hours.
  - `id`, `course_id`, `lesson_id` (kept if a lesson is removed), `minutes`, `studied_on`, `created_at`

2. Security
- Enable RLS on all three tables.
- Grant SELECT, INSERT, UPDATE, DELETE to `anon` and `authenticated` because the app has no sign-in and all data is intentionally shared by the app.
- Policies allow those roles to operate on rows. This is intentional for a no-login app.

3. Important notes
- Indexes are added on foreign keys and on the lesson ordering column.
- Minutes must be positive so that logged study time is always meaningful.
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_url text NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('video', 'playlist')),
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  youtube_id text NOT NULL,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lessons_course_position_idx ON lessons (course_id, position);

CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
  minutes integer NOT NULL CHECK (minutes > 0),
  studied_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_sessions_studied_on_idx ON study_sessions (studied_on);
CREATE INDEX IF NOT EXISTS study_sessions_course_idx ON study_sessions (course_id);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lessons TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON study_sessions TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
CREATE POLICY "anon_select_lessons" ON lessons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_lessons" ON lessons;
CREATE POLICY "anon_insert_lessons" ON lessons FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_lessons" ON lessons;
CREATE POLICY "anon_update_lessons" ON lessons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_lessons" ON lessons;
CREATE POLICY "anon_delete_lessons" ON lessons FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_study_sessions" ON study_sessions;
CREATE POLICY "anon_select_study_sessions" ON study_sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_study_sessions" ON study_sessions;
CREATE POLICY "anon_insert_study_sessions" ON study_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_study_sessions" ON study_sessions;
CREATE POLICY "anon_update_study_sessions" ON study_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_study_sessions" ON study_sessions;
CREATE POLICY "anon_delete_study_sessions" ON study_sessions FOR DELETE TO anon, authenticated USING (true);
