/*
# Store Telegram download identifiers

1. Purpose
Fix file retrieval by storing Telegram's downloadable file IDs separately
from Telegram's unique IDs.

2. Modified Table
- `files`
  - add `telegram_file_id` for the original uploaded file
  - add `telegram_thumbnail_file_id` for an optional preview thumbnail

3. Security
- Existing RLS policies remain unchanged.
- These identifiers are metadata only; the bot token remains server-side.
*/

ALTER TABLE files ADD COLUMN IF NOT EXISTS telegram_file_id text;
ALTER TABLE files ADD COLUMN IF NOT EXISTS telegram_thumbnail_file_id text;
