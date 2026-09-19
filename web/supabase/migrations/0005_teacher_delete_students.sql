-- Lets a teacher delete a student's profile (the new "Smazat" action in
-- Students.tsx). Scoped to role = 'student' so a teacher can't use this to
-- delete other teachers/moderators/parents.
--
-- No DELETE policy existed on profiles before this (checked against the
-- live schema - only "Povolit čtení profilu" and "Povolit úpravu profilu"
-- existed), so without this the delete button would just fail silently
-- against RLS.
--
-- Note: this does NOT delete the student's login (auth.users) - that
-- requires the Supabase service-role key, which must never be exposed to
-- the browser. After this runs, a deleted student can still authenticate
-- but has no profile row, so RequireRole bounces them straight back to the
-- login screen.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

create policy "Ucitel muze mazat zaky" on profiles
  for delete
  using (is_admin() and role = 'student');
