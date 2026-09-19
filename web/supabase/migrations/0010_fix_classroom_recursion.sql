-- Fixes "infinite recursion detected in policy for relation
-- classroom_members" from 0009.
--
-- The cycle: classrooms' "Zak vidi ucebny kde je clenem" policy queries
-- classroom_members (is this student a member?). classroom_members'
-- "Ucitel spravuje cleny svych ucemen" policy queries classrooms (is this
-- user the teacher who owns it?). Evaluating either table's RLS pulls in
-- the other table's RLS, which pulls the first back in - round in circles.
-- (Same root cause class as the invite_codes bug fixed in 0008, and why
-- assignment visibility already used SECURITY DEFINER functions in 0009 -
-- missed it for this pair.)
--
-- SECURITY DEFINER functions bypass RLS on the tables they query
-- internally, so calling one from inside a policy doesn't re-trigger that
-- table's RLS - breaking the cycle.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

create or replace function is_classroom_teacher(p_classroom_id uuid)
returns boolean
language sql
security definer
stable
as $function$
  select exists (select 1 from classrooms where id = p_classroom_id and teacher_id = auth.uid());
$function$;

create or replace function is_classroom_member(p_classroom_id uuid)
returns boolean
language sql
security definer
stable
as $function$
  select exists (select 1 from classroom_members where classroom_id = p_classroom_id and student_id = auth.uid());
$function$;

alter policy "Zak vidi ucebny kde je clenem" on classrooms
  using (is_classroom_member(classrooms.id));

alter policy "Ucitel spravuje cleny svych ucemen" on classroom_members
  using (is_classroom_teacher(classroom_members.classroom_id))
  with check (is_classroom_teacher(classroom_members.classroom_id));
