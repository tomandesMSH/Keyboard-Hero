-- Moderation (spec 5.7): a "Nahlásit" button on teacher feedback, and a
-- moderator queue to review reports and suspend a teacher's account.
--
-- practice_logs never recorded WHO graded it (submitGrading only touched
-- rating/feedback columns), so there was no way to know which teacher a
-- report about "feedback on this recording" was actually about. Adding
-- graded_by fixes that going forward — recordings graded before this
-- migration will have it null.
--
-- Moderator accounts don't have a signup path (same as the original
-- 'admin' role) — create one the same way we created the manual teacher
-- account: Authentication → Users → Add user, then set role='moderator'
-- (and is_verified/is_approved as you see fit) on their profiles row.
--
-- Note: practice_logs.id is bigint (unlike every other table in this
-- migration, which use uuid) — checked against the live schema after the
-- first version of this file failed with a type-mismatch error trying to
-- reference it as uuid.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local — it is not applied automatically.

alter table practice_logs add column if not exists graded_by uuid references profiles(id);

create table if not exists reported_content (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id),
  reported_user_id uuid references profiles(id),
  practice_log_id bigint references practice_logs(id),
  reason text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id),
  resolution_note text
);

alter table reported_content enable row level security;

create or replace function is_moderator()
returns boolean
language plpgsql
security definer
as $function$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'moderator'
  );
end;
$function$;

create policy "Kdokoli muze nahlasit obsah" on reported_content
  for insert
  with check (reporter_id = auth.uid());

create policy "Uzivatel cte vlastni nahlaseni" on reported_content
  for select
  using (reporter_id = auth.uid());

create policy "Moderator spravuje nahlaseni" on reported_content
  for all
  using (is_moderator())
  with check (is_moderator());

-- Lets a moderator actually suspend/reinstate an account (flip
-- is_banned) — mirrors the existing is_admin() blanket-write policy on
-- profiles rather than introducing a narrower column-level grant, so it's
-- consistent with (if just as broad as) what's already there.
create policy "Moderator spravuje ucty" on profiles
  for update
  using (is_moderator())
  with check (is_moderator());

-- A moderator needs to see reporter/reported-user names to make sense of a
-- queue entry — mirrors is_admin()'s existing blanket profile-read grant.
create policy "Moderator cte profily" on profiles
  for select
  using (is_moderator());

-- Existing practice_logs policies only let a teacher (is_admin()) or the
-- student themselves read a recording — a moderator had no way to actually
-- listen to what was reported. Scoped to only rows that have been
-- reported, not blanket access to every student's recordings.
create policy "Moderator cte nahlasene nahravky" on practice_logs
  for select
  using (
    is_moderator()
    and exists (select 1 from reported_content rc where rc.practice_log_id = practice_logs.id)
  );
