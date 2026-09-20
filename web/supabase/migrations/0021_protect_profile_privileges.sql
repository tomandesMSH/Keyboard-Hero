-- Closes two privilege-escalation holes found in the security review of 0020:
--
-- 1) handle_new_user() copied `role` straight from the signUp metadata
--    (raw_user_meta_data->>'role'), which the CLIENT controls. Anyone could
--    call supabase.auth.signUp({ ..., options: { data: { role: 'moderator' } } })
--    and become an admin the moment they registered. The public signup flow
--    only ever needs 'student' and 'teacher' (Login.tsx), so anything else is
--    now downgraded to 'student'. New teachers still start unverified
--    (is_verified defaults to false) and only a moderator can verify them.
--
-- 2) Nothing stopped a signed-in user from editing the privilege columns on
--    profiles (role, is_moderator, is_verified, is_approved, is_banned)
--    through the ordinary API. Those columns decide who is a moderator, so
--    together with admin_reset_password (0020) that meant account takeover of
--    ANY account, including the admin. A BEFORE UPDATE trigger now enforces
--    who may change what, regardless of which RLS policy let the row through:
--      * role and is_moderator can NOT be changed from the app at all. Make
--        someone a teacher-admin or a dedicated admin in the Supabase SQL
--        editor (no user session, so the trigger lets it through).
--      * is_banned / is_verified / is_approved: a moderator may change them on
--        any account that is not itself an admin; a verified teacher may only
--        approve/unapprove STUDENTS (is_approved). An admin's own row is
--        untouchable from the app, so a banned admin cannot unban themselves.
--    The service role and the SQL editor have no auth.uid(), so scripts,
--    migrations and manual fixes keep working.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.
--
-- AFTER RUNNING - audit for accounts that already escalated themselves:
--   select id, username, full_name, role, is_moderator, is_verified, created_at
--   from profiles
--   where role in ('moderator', 'teacher') or is_moderator
--   order by role, created_at;
--   select email, raw_user_meta_data->>'role' as requested_role, created_at
--   from auth.users
--   where raw_user_meta_data->>'role' is distinct from 'student'
--   order by created_at;
-- Anything you do not recognise: set role = 'student', is_moderator = false,
-- is_verified = false (or delete the account), and reset its password.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_requested_role text := new.raw_user_meta_data->>'role';
begin
  insert into public.profiles (id, username, full_name, role, streak, stars)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when v_requested_role in ('student', 'teacher') then v_requested_role else 'student' end,
    1,
    0
  )
  on conflict (id) do update set
    username = excluded.username;
  return new;
end;
$function$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  -- No user session: service role, SQL editor, migrations, signup trigger.
  if auth.uid() is null then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.is_moderator is distinct from old.is_moderator then
    raise exception 'Roli a příznak admina nelze měnit z aplikace.';
  end if;

  if new.is_verified is distinct from old.is_verified
     or new.is_banned is distinct from old.is_banned
     or new.is_approved is distinct from old.is_approved then
    -- A moderator manages every account that is not itself an admin.
    if is_moderator() and old.role <> 'moderator' and not coalesce(old.is_moderator, false) then
      return new;
    end if;
    -- A verified teacher may only approve students.
    if is_admin()
       and old.role = 'student'
       and new.is_verified is not distinct from old.is_verified
       and new.is_banned is not distinct from old.is_banned then
      return new;
    end if;
    raise exception 'Tuto změnu účtu nemáš oprávnění provést.';
  end if;

  return new;
end;
$function$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileges();
