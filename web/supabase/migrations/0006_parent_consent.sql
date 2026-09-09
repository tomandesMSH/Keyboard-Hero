-- GDPR consent (spec 1.3), simplified for a single-school deployment with
-- no email in the app at all (see the auth redesign earlier in this
-- project): instead of a separate parent portal reached via a magic-link
-- invite, consent is captured directly in the registration form — a parent
-- of a minor is expected to be present at registration (in person at the
-- school), so there's no async "wait for the parent to click a link" step
-- to build.
--
-- date_of_birth determines whether a student needs guardian consent
-- (see AGE_OF_CONSENT in web/src/lib/consent.ts). consent_given records
-- that consent (self or guardian) was captured; consent_guardian_name is
-- only filled in for minors.
--
-- Existing accounts are grandfathered in as consent_given = true — this is
-- a new requirement being added after the fact, and re-litigating consent
-- for every already-active student isn't something this migration can do.
--
-- Run this manually in the Supabase SQL editor for the project referenced
-- in web/.env.local — it is not applied automatically.

  alter table profiles
    add column if not exists date_of_birth date,
    add column if not exists consent_given boolean not null default false,
    add column if not exists consent_guardian_name text,
    add column if not exists consent_given_at timestamptz;

  update profiles set consent_given = true, consent_given_at = now() where consent_given = false;
