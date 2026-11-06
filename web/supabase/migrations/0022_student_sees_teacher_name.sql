-- Students should see which teacher set an assignment, by real name
-- (profiles.full_name) - but NOT the teacher's username, which can be a
-- nickname. A student has no select policy on a classroom teacher's profile
-- row, and adding one would expose every column (username included), so
-- instead this SECURITY DEFINER function returns only id + full_name, and
-- only for teachers of classrooms the caller is a member of.
--
-- Run this manually in the Supabase SQL editor.

create or replace function public.my_classroom_teacher_names()
returns table (teacher_id uuid, full_name text)
language sql
security definer
stable
set search_path = public
as $function$
  select distinct p.id, p.full_name
  from classroom_members cm
  join classrooms c on c.id = cm.classroom_id
  join profiles p on p.id = c.teacher_id
  where cm.student_id = auth.uid();
$function$;

revoke execute on function public.my_classroom_teacher_names() from public, anon;
grant execute on function public.my_classroom_teacher_names() to authenticated;
