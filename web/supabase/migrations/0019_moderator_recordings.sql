-- Admin dashboard "Nahrávky" section: lets a moderator browse and delete
-- ANY student's recording, not just ones already under an open report.
-- The existing moderator read access to practice_logs ("Moderator cte
-- nahlasene nahravky", 0011) is scoped to reported content only, and the
-- teacher-facing is_admin() policies (0014) are scoped to a teacher's own
-- classroom students - neither covers "any recording, any student", which
-- is exactly a moderator's job.
--
-- Deleting a recording's storage file needs the same escape hatch: the
-- "Admini mohou mazat soubory ze storage" policy (0002, recordings bucket)
-- only checks role = 'teacher', which a dedicated moderator account
-- (role = 'moderator', not also a teacher) never satisfies.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

create policy "Moderator cte vsechny nahravky" on practice_logs
  for select
  using (is_moderator());

create policy "Moderator maze libovolnou nahravku" on practice_logs
  for delete
  using (is_moderator());

alter policy "Admini mohou mazat soubory ze storage" on storage.objects
  using (
    (bucket_id = 'recordings'::text)
    and (
      (select profiles.role from profiles where profiles.id = auth.uid()) = 'teacher'::text
      or is_moderator()
    )
  );
