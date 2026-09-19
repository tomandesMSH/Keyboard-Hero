-- Fixes two issues from tonight's security review before the first push.
--
-- 1) is_admin() only checked role = 'teacher', never is_verified - so
--    self-registered teacher accounts (Login.tsx "Jsem učitel") got full
--    admin-level access (read/write every profile, read/delete every
--    recording, delete any student) the instant they signed up, with zero
--    identity check. is_verified existed but nothing enforced it.
--
--    Existing accounts are unaffected: 0003 already grandfathered every
--    profile that existed at the time to is_verified = true, so real
--    teachers don't get locked out - only NEW unverified signups lose
--    admin access until a moderator/admin manually verifies them.
--
-- 2) The reported_content insert policy accepted any practice_log_id with
--    no check that the reporter owns that recording. Since practice_logs.id
--    is a sequential bigint (guessable), any student could file a report
--    naming another student's recording, and the moderator queue would
--    fetch and play that audio the moment the queue loaded - no ownership
--    check anywhere in the chain. Now a report can only reference a
--    practice_log_id that belongs to the reporter themselves (or none at
--    all, for a report not tied to a specific recording).
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

create or replace function is_admin()
returns boolean
language plpgsql
security definer
as $function$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'teacher'
      and coalesce(is_verified, false) = true
  );
end;
$function$;

alter policy "Kdokoli muze nahlasit obsah" on reported_content
  with check (
    reporter_id = auth.uid()
    and (
      practice_log_id is null
      or exists (
        select 1 from practice_logs pl
        where pl.id = practice_log_id and pl.user_id = auth.uid()
      )
    )
  );
