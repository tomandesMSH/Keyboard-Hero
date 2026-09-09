-- Fixes a bug in 0007: after a student redeems an invite code (setting
-- redeemed_by = their own id), the teacher_student_links insert policy
-- checks "exists a redeemed invite_codes row for this student+teacher" —
-- but that subquery is itself subject to invite_codes' RLS, and no
-- existing policy let a student see an invite row they'd just redeemed
-- (only "unredeemed" or "mine as the issuing teacher"). So the exists
-- check always failed and the link was never created.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local — it is not applied automatically.

create policy "Zak cte vlastni vykoupene pozvanky" on invite_codes
  for select
  using (redeemed_by = auth.uid());
