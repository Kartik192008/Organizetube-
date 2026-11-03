/*
# Add per-video watch progress

1. Modified Tables
- `lessons`
  - `duration_seconds` (integer, nullable): total length of the video, entered by the user once.
  - `watched_seconds` (integer, default 0): the timestamp the user has watched up to.

2. Security
- No policy or grant changes. Existing public access rules on `lessons` already cover new columns.

3. Important notes
- Existing rows keep their completion state. New columns default to unknown length and zero watched time.
- Values must be non-negative, and length must be positive when set.
*/

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds > 0);
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS watched_seconds integer NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0);
