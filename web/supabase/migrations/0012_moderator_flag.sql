-- Moderator access needs to be independent of role: adminV should stay a
-- fully-working teacher AND also be able to moderate - a single 'role'
-- value can't represent "both". Adding a separate is_moderator flag
-- follows the same pattern already used for is_approved/is_banned/
-- is_verified (independent capability flags on profiles, not folded into
-- 'role').
--
-- role = 'moderator' still works too (for a future dedicated,
-- non-teacher moderator account) - is_moderator() now checks either.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

alter table profiles add column if not exists is_moderator boolean not null default false;

create or replace function is_moderator()
returns boolean
language plpgsql
security definer
as $function$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'moderator' or is_moderator = true)
  );
end;
$function$;

update profiles set is_moderator = true
where id = (select id from auth.users where email = 'adminv@keyboardhero.internal');
