-- Real teacher-student pairing (spec 5.6), simplified for this app's
-- architecture: since GDPR consent is already captured at registration
-- (migration 0006), there's no separate async "wait for parent consent"
-- step here - redeeming a valid invite code activates the link
-- immediately, no pending_invite state needed.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

create table if not exists invite_codes (
  code text primary key,
  teacher_id uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  redeemed_by uuid references profiles(id),
  redeemed_at timestamptz
);

create table if not exists teacher_student_links (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles(id),
  student_id uuid not null references profiles(id),
  status text not null default 'active' check (status in ('active', 'revoked')),
  share_progress boolean not null default false,
  created_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

alter table invite_codes enable row level security;
alter table teacher_student_links enable row level security;

-- invite_codes: a teacher manages their own; anyone signed in can look up
-- an unredeemed code (needed to redeem one), and only redeem it as
-- themselves.
create policy "Ucitel cte vlastni pozvanky" on invite_codes
  for select using (teacher_id = auth.uid());

create policy "Nevyuzite pozvanky jsou viditelne pro vykupeni" on invite_codes
  for select using (redeemed_by is null);

create policy "Ucitel vytvari pozvanky" on invite_codes
  for insert
  with check (
    teacher_id = auth.uid()
    and is_admin()
    and coalesce((select is_verified from profiles where id = auth.uid()), false)
  );

create policy "Kdokoli muze vykoupit nevyuzitou pozvanku" on invite_codes
  for update
  using (redeemed_by is null)
  with check (redeemed_by = auth.uid());

-- teacher_student_links: teacher and student can each see/revoke their own
-- side; only a teacher can create a link directly, a student can only
-- create one by having actually redeemed that teacher's invite code first.
create policy "Ucitel cte propojeni se svymi zaky" on teacher_student_links
  for select using (teacher_id = auth.uid());

create policy "Zak cte propojeni se svymi ucitely" on teacher_student_links
  for select using (student_id = auth.uid());

create policy "Ucitel vytvari propojeni" on teacher_student_links
  for insert with check (teacher_id = auth.uid());

create policy "Zak vytvari propojeni pres vykoupenou pozvanku" on teacher_student_links
  for insert
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from invite_codes ic
      where ic.teacher_id = teacher_student_links.teacher_id
        and ic.redeemed_by = auth.uid()
    )
  );

create policy "Ucitel meni propojeni se svymi zaky" on teacher_student_links
  for update using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

create policy "Zak meni sve propojeni" on teacher_student_links
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "Ucitel maze propojeni" on teacher_student_links
  for delete using (teacher_id = auth.uid());

create policy "Zak maze sve propojeni" on teacher_student_links
  for delete using (student_id = auth.uid());

-- Existing profiles RLS lets a teacher read any profile (is_admin()) but
-- only lets everyone else read their own row - so without this, a student
-- couldn't see their linked teacher's name at all. Adds to (not replaces)
-- the existing "Povolit čtení profilu" policy; Postgres OR's permissive
-- policies together.
create policy "Zak cte profil sveho propojeneho ucitele" on profiles
  for select
  using (
    exists (
      select 1 from teacher_student_links tsl
      where tsl.teacher_id = profiles.id
        and tsl.student_id = auth.uid()
        and tsl.status = 'active'
    )
  );
