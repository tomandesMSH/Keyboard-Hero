-- Adds structured grading fields to practice_logs. Purely additive (no drops,
-- no RLS changes expected — the existing UPDATE policy on practice_logs
-- already lets a teacher/admin modify a row's columns).
--
-- Run this manually in the Supabase SQL editor for the project referenced in
-- web/.env.local — it is not applied automatically.

alter table practice_logs
  add column if not exists rating smallint,
  add column if not exists feedback_good text,
  add column if not exists feedback_improve text;
