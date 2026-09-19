-- Renames the 'admin' role to 'teacher' (that's what it has always meant in
-- the UI) and adds two new roles used by upcoming work: 'parent' and
-- 'moderator'.
--
-- Verified against the live schema before writing this (see the
-- conversation this shipped in): profiles.role is plain text with no CHECK
-- constraint and no enum type, so this adds a fresh CHECK constraint rather
-- than hunting for one to replace.
--
-- Six things hardcode role = 'admin' and would silently break for every
-- teacher if this migration only renamed the data:
--   - is_admin() (SECURITY DEFINER function), used by the two `profiles`
--     RLS policies ("Povolit čtení profilu", "Povolit úpravu profilu").
--     Fixed with CREATE OR REPLACE - those two policies call the function
--     by name and don't need to change themselves.
--   - 4 RLS policies that inline role = 'admin' directly: 3 on
--     practice_logs (SELECT/UPDATE/DELETE - this is what backs Grading.tsx
--     and the teacher dashboard's pending-review queue) and 1 on
--     storage.objects (DELETE, recordings bucket). Fixed with
--     ALTER POLICY ... USING (...), which swaps the expression with no
--     window where the policy doesn't exist (unlike DROP + CREATE).
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

-- 1) Migrate existing data first - the CHECK constraint added in step 2
--    would otherwise reject any row still holding 'admin'.
update profiles set role = 'teacher' where role = 'admin';

-- 2) Constrain role to the now-4-way set of values.
alter table profiles
  add constraint profiles_role_check
  check (role in ('student', 'teacher', 'parent', 'moderator'));

-- 3) is_admin() - used by the profiles RLS policies.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $function$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
end;
$function$;

-- 4) practice_logs policies that inline role = 'admin'.
--    Names kept as-is (still say "Admini") to minimize this migration's
--    footprint - cosmetic rename can happen separately if you want it.
alter policy "Admini mohou číst všechny nahrávky" on practice_logs
  using (
    (auth.uid() = user_id)
    or ((select profiles.role from profiles where profiles.id = auth.uid()) = 'teacher'::text)
  );

alter policy "Admini mohou mazat nahrávky" on practice_logs
  using ((select profiles.role from profiles where profiles.id = auth.uid()) = 'teacher'::text);

alter policy "Admini mohou upravovat nahrávky" on practice_logs
  using ((select profiles.role from profiles where profiles.id = auth.uid()) = 'teacher'::text);

-- 5) storage.objects policy that inlines role = 'admin'.
alter policy "Admini mohou mazat soubory ze storage" on storage.objects
  using (
    (bucket_id = 'recordings'::text)
    and ((select profiles.role from profiles where profiles.id = auth.uid()) = 'teacher'::text)
  );

-- Sanity check after running the above - should show only 'teacher' (plus
-- 'student' for everyone else), never 'admin':
-- select distinct role from profiles;
