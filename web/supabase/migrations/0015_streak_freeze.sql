-- Real streak/stars accrual plus streak freeze (spec 4.3). Until now
-- profiles.stars and profiles.streak were never written by any app code or
-- trigger - they only held whatever a row was seeded with. This migration
-- adds the missing state and a single RPC that the client calls once per
-- submitted recording to update both atomically (avoids a read-modify-write
-- race between two tabs/devices).
--
-- Freeze allowance resets to 1 at the start of each calendar month (server
-- UTC date - a per-user timezone is out of scope for now, documented
-- simplification). A freeze only bridges exactly one missed day; a gap of
-- two or more missed days still resets the streak to 1, same as Duolingo's
-- model referenced in the spec.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local - it is not applied automatically.

alter table profiles
  add column if not exists streak_freezes_available smallint not null default 1,
  add column if not exists streak_freeze_month text,
  add column if not exists last_practice_date date;

create table if not exists streak_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  date date not null,
  status text not null check (status in ('completed', 'freeze_used', 'missed')),
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

alter table streak_events enable row level security;

create policy "Zak cte vlastni streak historii" on streak_events
  for select using (student_id = auth.uid());

create policy "Ucitel cte streak historii zaku ve svych ucebnach" on streak_events
  for select
  using (
    exists (
      select 1 from classroom_members cm
      join classrooms c on c.id = cm.classroom_id
      where c.teacher_id = auth.uid() and cm.student_id = streak_events.student_id
    )
  );

-- No insert/update policy on purpose: rows are only ever written by
-- record_practice_session below, which runs SECURITY DEFINER and so
-- bypasses RLS entirely.

create or replace function record_practice_session(p_user_id uuid)
returns table (stars int, streak int, streak_freezes_available smallint)
language plpgsql
security definer
as $function$
declare
  v_last_date date;
  v_streak int;
  v_stars int;
  v_freezes smallint;
  v_freeze_month text;
  v_today date := (now() at time zone 'utc')::date;
  v_current_month text := to_char(v_today, 'YYYY-MM');
begin
  if p_user_id <> auth.uid() then
    raise exception 'Lze zaznamenat pouze vlastní procvičování.';
  end if;

  select p.last_practice_date, p.streak, p.stars, p.streak_freezes_available, p.streak_freeze_month
    into v_last_date, v_streak, v_stars, v_freezes, v_freeze_month
    from profiles p
    where p.id = p_user_id
    for update;

  if v_freeze_month is null or v_freeze_month <> v_current_month then
    v_freezes := 1;
    v_freeze_month := v_current_month;
  end if;

  if v_last_date = v_today then
    -- already practiced today: stars still accrue below, streak untouched
    null;
  elsif v_last_date = v_today - 1 then
    v_streak := coalesce(v_streak, 0) + 1;
  elsif v_last_date = v_today - 2 and v_freezes > 0 then
    v_freezes := v_freezes - 1;
    v_streak := coalesce(v_streak, 0) + 1;
    insert into streak_events (student_id, date, status) values (p_user_id, v_today - 1, 'freeze_used')
      on conflict (student_id, date) do update set status = 'freeze_used';
  else
    v_streak := 1;
  end if;

  v_stars := coalesce(v_stars, 0) + 1;

  insert into streak_events (student_id, date, status) values (p_user_id, v_today, 'completed')
    on conflict (student_id, date) do update set status = 'completed';

  update profiles set
    stars = v_stars,
    streak = v_streak,
    last_practice_date = v_today,
    streak_freezes_available = v_freezes,
    streak_freeze_month = v_current_month
  where id = p_user_id;

  return query select v_stars, v_streak, v_freezes;
end;
$function$;

grant execute on function record_practice_session(uuid) to authenticated;
