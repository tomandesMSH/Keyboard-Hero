-- Classrooms replace the direct teacher-student invite/pairing model from
-- 0007/0008 entirely: a teacher creates a classroom, students join with a
-- code, and everything (progress visibility, assignments) scopes off
-- classroom membership instead of a 1:1 link. Progress sharing is
-- automatic for classroom members — no opt-out toggle, that was a product
-- decision, not a technical one.
--
-- The old invite_codes / teacher_student_links tables are left in place
-- (unused) rather than dropped — say the word if you want a follow-up
-- migration to remove them once nothing needs that history.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local — it is not applied automatically.

create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id),
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists classroom_members (
  classroom_id uuid not null references classrooms(id) on delete cascade,
  student_id uuid not null references profiles(id),
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  teacher_id uuid not null references profiles(id),
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- No rows for an assignment = assigned to the whole classroom. One row =
-- "just this student". Several rows = "selected students". Same shape
-- covers all three cases from the product ask.
create table if not exists assignment_recipients (
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references profiles(id),
  primary key (assignment_id, student_id)
);

alter table practice_logs add column if not exists assignment_id uuid references assignments(id);

alter table classrooms enable row level security;
alter table classroom_members enable row level security;
alter table assignments enable row level security;
alter table assignment_recipients enable row level security;

-- classrooms
create policy "Ucitel spravuje sve ucebny" on classrooms
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Zak vidi ucebny kde je clenem" on classrooms
  for select
  using (exists (
    select 1 from classroom_members cm
    where cm.classroom_id = classrooms.id and cm.student_id = auth.uid()
  ));

-- classroom_members — students get NO select policy here at all. That's
-- the "students don't see each other" requirement: even querying their own
-- membership row would, under a normal policy, let them list every other
-- row in the same classroom_id. Joining goes through join_classroom()
-- below instead of a direct insert, and a student's own classrooms are
-- read from the classrooms table (which only exposes name/id, not the
-- roster) via the policy above.
create policy "Ucitel spravuje cleny svych ucemen" on classroom_members
  for all
  using (exists (select 1 from classrooms c where c.id = classroom_members.classroom_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from classrooms c where c.id = classroom_members.classroom_id and c.teacher_id = auth.uid()));

-- A student can read (and delete) only their OWN row here — never a
-- classmate's. That's what actually delivers "students don't see each
-- other": row-level filtering on student_id, not a blanket absence of any
-- select policy (which would have also blocked a student from confirming
-- their own membership, breaking fetchStudentClassrooms's embedded join).
create policy "Zak cte vlastni clenstvi" on classroom_members
  for select
  using (student_id = auth.uid());

create policy "Zak muze opustit ucebnu" on classroom_members
  for delete
  using (student_id = auth.uid());

-- assignments
create policy "Ucitel spravuje ukoly ve svych ucebnach" on assignments
  for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

-- assignment_has_recipients / assignment_targets_me are SECURITY DEFINER on
-- purpose: without them, the policy below would need to subquery
-- assignment_recipients directly, which is itself RLS-protected to "only
-- your own row" for students — so a plain EXISTS from inside another row's
-- policy could never see OTHER students' targeting rows and would treat
-- every targeted assignment as untargeted. (This is exactly the bug fixed
-- in 0008 for invite_codes — same shape, so fixed properly up front here.)
create or replace function assignment_has_recipients(p_assignment_id uuid)
returns boolean
language sql
security definer
stable
as $function$
  select exists (select 1 from assignment_recipients where assignment_id = p_assignment_id);
$function$;

create or replace function assignment_targets_me(p_assignment_id uuid)
returns boolean
language sql
security definer
stable
as $function$
  select exists (
    select 1 from assignment_recipients
    where assignment_id = p_assignment_id and student_id = auth.uid()
  );
$function$;

create policy "Zak cte prislusne ukoly ve svych ucebnach" on assignments
  for select
  using (
    exists (
      select 1 from classroom_members cm
      where cm.classroom_id = assignments.classroom_id and cm.student_id = auth.uid()
    )
    and (not assignment_has_recipients(assignments.id) or assignment_targets_me(assignments.id))
  );

-- assignment_recipients
create policy "Ucitel spravuje cilene zaky ukolu" on assignment_recipients
  for all
  using (exists (select 1 from assignments a where a.id = assignment_recipients.assignment_id and a.teacher_id = auth.uid()))
  with check (exists (select 1 from assignments a where a.id = assignment_recipients.assignment_id and a.teacher_id = auth.uid()));

create policy "Zak cte vlastni cilene ukoly" on assignment_recipients
  for select
  using (student_id = auth.uid());

-- Joining a classroom goes through this function (not a direct insert),
-- so the join_code never has to be exposed through a broadly-readable
-- SELECT policy on classrooms — a student who doesn't know the code has no
-- way to discover or browse other classrooms at all.
create or replace function join_classroom(p_code text)
returns uuid
language plpgsql
security definer
as $function$
declare
  v_classroom_id uuid;
begin
  select id into v_classroom_id from classrooms where join_code = upper(trim(p_code));
  if v_classroom_id is null then
    raise exception 'Neplatný kód učebny.';
  end if;

  insert into classroom_members (classroom_id, student_id)
  values (v_classroom_id, auth.uid())
  on conflict (classroom_id, student_id) do nothing;

  return v_classroom_id;
end;
$function$;
