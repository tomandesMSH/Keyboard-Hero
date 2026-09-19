-- Follow-up to 0015: without this, every student's first recording after
-- 0015 was applied would see record_practice_session() treat them as never
-- having practiced (last_practice_date was left null by 0015 for existing
-- rows), resetting their streak to 1 even if they practiced yesterday.
-- Backfills last_practice_date from each student's most recent practice_logs
-- row. Does not touch the existing `streak` number itself - only prevents an
-- unwarranted reset on the very next recording.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

update profiles p
set last_practice_date = latest.last_date
from (
  select user_id, max(created_at)::date as last_date
  from practice_logs
  group by user_id
) latest
where latest.user_id = p.id
  and p.last_practice_date is null;
