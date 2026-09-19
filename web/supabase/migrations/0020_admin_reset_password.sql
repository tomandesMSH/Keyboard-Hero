-- "Zapomněli jste heslo?" - the app has no real email addresses (every
-- account is username@keyboardhero.internal), so the usual emailed reset link
-- can't work. Instead a person with authority over the account sets a new
-- password for it:
--   * a verified teacher (is_admin()) can reset a STUDENT's password
--   * a moderator (is_moderator()) can reset a student's or teacher's password
-- Nobody can reset a moderator's password through this - that would make any
-- moderator (or a compromised one) a route to taking over every other
-- moderator account. Moderators change theirs in the Supabase dashboard.
--
-- The browser can't touch auth.users (that needs the service-role key), so
-- this is a security definer function, same approach as is_admin() and
-- is_moderator(). It also drops the user's existing sessions so a stolen or
-- shared login stops working the moment the password is reset.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

create or replace function admin_reset_password(p_user_id uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_target_role text;
  v_target_is_moderator boolean;
begin
  if auth.uid() is null then
    raise exception 'Nejsi přihlášený.';
  end if;

  -- Same minimum length Supabase Auth enforces on signUp by default.
  if p_new_password is null or length(p_new_password) < 6 then
    raise exception 'Heslo musí mít alespoň 6 znaků.';
  end if;

  select role::text, (role = 'moderator' or coalesce(is_moderator, false))
    into v_target_role, v_target_is_moderator
  from public.profiles
  where id = p_user_id;

  if v_target_role is null then
    raise exception 'Uživatel neexistuje.';
  end if;

  if v_target_is_moderator then
    raise exception 'Heslo moderátora nelze tímto způsobem změnit.';
  end if;

  if not (is_moderator() or (is_admin() and v_target_role = 'student')) then
    raise exception 'K obnovení tohoto hesla nemáš oprávnění.';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = p_user_id;

  -- Sign the user out everywhere. auth.sessions cascades to refresh tokens.
  delete from auth.sessions where user_id = p_user_id;
end;
$function$;

revoke all on function admin_reset_password(uuid, text) from public, anon;
grant execute on function admin_reset_password(uuid, text) to authenticated;
