-- Adds identity verification tracking for teacher accounts (spec 5.5).
-- Named is_verified (boolean) rather than a text status, to match the
-- existing is_approved / is_banned convention on profiles rather than
-- introducing a different style.
--
-- MVP is binary and manual: new teacher signups start unverified; a
-- moderator/admin flips this to true by hand in the Supabase dashboard
-- after checking their identity (document upload review is explicitly
-- deferred in the spec too). There is no gate wired to this yet - pairing
-- (which is what verification is meant to gate, per 5.6) doesn't exist in
-- this repo either - so today the column is informational only, surfaced
-- on the teacher's own profile screen.
--
-- Existing accounts are grandfathered in as verified so nobody loses access
-- retroactively when this migration runs.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

alter table profiles
  add column if not exists is_verified boolean not null default false;

update profiles set is_verified = true;
