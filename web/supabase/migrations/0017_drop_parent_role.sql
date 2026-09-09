-- Drops 'parent' as a valid profiles.role. It was added in 0002 for a
-- planned parent portal that was never built — no signup path in Login.tsx
-- ever creates one, RequireRole never had a home screen for it, and product
-- decided not to build it (see conversation this shipped in). GDPR consent
-- for minors is unaffected: that's captured directly on the student's own
-- profile (date_of_birth, consent_given, consent_guardian_name — see 0006),
-- not through a separate parent account.
--
-- Fails loudly instead of silently reassigning if any profile actually has
-- role = 'parent' — that would mean the assumption above is wrong and needs
-- a human to look, not a migration to guess.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local — it is not applied automatically.

do $$
begin
  if exists (select 1 from profiles where role = 'parent') then
    raise exception 'profiles.role = ''parent'' rows exist — resolve them before dropping the role.';
  end if;
end;
$$;

alter table profiles drop constraint if exists profiles_role_check;

alter table profiles
  add constraint profiles_role_check
  check (role in ('student', 'teacher', 'moderator'));
