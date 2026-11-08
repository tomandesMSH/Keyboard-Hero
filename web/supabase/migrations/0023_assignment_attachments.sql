-- Integrace s Keyboard Utils: an assignment can carry a score (MIDI /
-- MusicXML) that the student downloads and practises in the Keyboard Utils
-- desktop app. Optional - most assignments won't have one.
--
-- Files live in the private bucket "assignment-files" at
-- <assignment id>/<file name>. Read access follows the assignments table:
-- whoever can see the assignment row (its teacher, the students it's set for -
-- see the RLS policies in 0009) can download its file. Only the assignment's
-- teacher can add or remove it. The app downloads through short-lived signed
-- URLs, so the bucket stays private.
--
-- Run this manually in the Supabase SQL editor.

alter table assignments add column if not exists attachment_path text;
alter table assignments add column if not exists attachment_name text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('assignment-files', 'assignment-files', false, 5242880)
on conflict (id) do nothing;

-- The subqueries run with the caller's own RLS on assignments, so "exists"
-- is true exactly for the assignments the caller may see (or owns).
create policy "Prilohu ukolu cte, kdo vidi ukol" on storage.objects
  for select
  using (
    bucket_id = 'assignment-files'
    and exists (
      select 1 from public.assignments a
      where a.id::text = (storage.foldername(name))[1]
    )
  );

create policy "Ucitel nahrava prilohy svych ukolu" on storage.objects
  for insert
  with check (
    bucket_id = 'assignment-files'
    and exists (
      select 1 from public.assignments a
      where a.id::text = (storage.foldername(name))[1] and a.teacher_id = auth.uid()
    )
  );

create policy "Ucitel maze prilohy svych ukolu" on storage.objects
  for delete
  using (
    bucket_id = 'assignment-files'
    and exists (
      select 1 from public.assignments a
      where a.id::text = (storage.foldername(name))[1] and a.teacher_id = auth.uid()
    )
  );
