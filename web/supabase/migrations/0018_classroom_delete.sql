-- Lets a moderator (the site's admin role, is_moderator()) delete ANY
-- classroom, not just their own - mirrors the existing admin escape hatch
-- is_admin() already has on profiles/practice_logs. The owning teacher can
-- already delete their own classroom: "Ucitel spravuje sve ucebny" (0009)
-- is a `for all` policy on teacher_id = auth.uid(), delete included.
--
-- Deleting a classroom cascades to assignments, assignment_recipients and
-- classroom_members (all declared "on delete cascade" in 0009). But
-- practice_logs.assignment_id was left as a plain FK with no ON DELETE
-- action, so deleting an assignment that already has graded recordings
-- against it would raise a foreign-key violation and block the whole
-- classroom delete. Switch it to SET NULL: the recording and its grade
-- stay, only the link back to the now-gone assignment is cleared.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

alter table practice_logs drop constraint if exists practice_logs_assignment_id_fkey;
alter table practice_logs
  add constraint practice_logs_assignment_id_fkey
  foreign key (assignment_id) references assignments(id) on delete set null;

create policy "Moderator maze libovolnou ucebnu" on classrooms
  for delete
  using (is_moderator());
