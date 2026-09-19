-- profiles.is_approved already existed before this repo's migrations
-- (student registration is meant to require teacher approval), but nothing
-- in the app ever checked it, so it's been sitting at its default (false)
-- for every student without blocking anything.
--
-- This migration doesn't touch the column - it only exists to grandfather
-- in students who registered before the app started enforcing it (see the
-- RequireRole change that ships alongside this). Without this, every
-- existing student would suddenly be locked out on deploy, waiting on an
-- approval nobody knew to give.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically. Run it right before
-- (or right after) deploying the frontend change that starts enforcing
-- is_approved, not before - newly-registered students in the gap should
-- still land in the approval queue, not get auto-approved by re-running this.

update profiles set is_approved = true where role = 'student' and is_approved = false;
