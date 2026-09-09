-- Scopes teacher access to practice_logs down to classroom membership, and
-- adds an explicit opt-in for a student's own (non-assigned) practice logs
-- (spec 5.3). Previously ANY verified teacher could read/update/delete ANY
-- student's practice_logs system-wide, regardless of classroom — that was a
-- side effect of the 0002 role migration, not a deliberate product decision
-- (unlike the automatic classroom-scoped sharing documented in 0009, which
-- this migration does not change).
--
-- After this migration a teacher can see a student's practice log only if
-- both are true:
--   1. the student is a member of one of that teacher's classrooms, and
--   2. either the log belongs to an assignment that teacher created, or the
--      student has opted in via profiles.share_basic_progress.
--
-- storage.objects delete policy (recordings bucket) is left as-is — it's a
-- moderation capability (removing inappropriate audio), not a progress-view
-- capability, so it's out of scope here.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local — it is not applied automatically.

alter table profiles
  add column if not exists share_basic_progress boolean not null default false;

create or replace function teacher_can_view_practice_log(p_teacher_id uuid, p_student_id uuid, p_assignment_id uuid)
returns boolean
language sql
security definer
stable
as $function$
  select
    exists (
      select 1
      from classroom_members cm
      join classrooms c on c.id = cm.classroom_id
      where c.teacher_id = p_teacher_id and cm.student_id = p_student_id
    )
    and (
      (
        p_assignment_id is not null
        and exists (select 1 from assignments a where a.id = p_assignment_id and a.teacher_id = p_teacher_id)
      )
      or coalesce((select share_basic_progress from profiles where id = p_student_id), false)
    )
$function$;

alter policy "Admini mohou číst všechny nahrávky" on practice_logs
  using (
    (auth.uid() = user_id)
    or (is_admin() and teacher_can_view_practice_log(auth.uid(), user_id, assignment_id))
  );

alter policy "Admini mohou upravovat nahrávky" on practice_logs
  using (is_admin() and teacher_can_view_practice_log(auth.uid(), user_id, assignment_id));

alter policy "Admini mohou mazat nahrávky" on practice_logs
  using (is_admin() and teacher_can_view_practice_log(auth.uid(), user_id, assignment_id));
