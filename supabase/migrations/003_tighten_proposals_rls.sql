-- Migration 003: Tighten proposals SELECT RLS (defense-in-depth for C3/C4)
--
-- Problem: migration 001 created
--   CREATE POLICY "Anyone can view proposals" ON proposals FOR SELECT
--     TO authenticated USING (true);
-- which lets ANY authenticated user read EVERY proposal — including
-- plaque_inquiry rows that carry building-owner contact PII
-- (inquiry_name / inquiry_email / inquiry_phone, added in migration 002).
--
-- This migration replaces that blanket policy with an owner-or-admin policy,
-- while still allowing authenticated users to view *approved* community
-- additions (which are meant to be public) — but never plaque_inquiry rows.
--
-- NOTE: This must be applied to the Supabase project (it does not run
-- automatically). The application's API routes already enforce the same rule
-- server-side (see src/lib/supabase/admin.ts requireAdmin); this policy is the
-- database-level backstop so a direct client query cannot bypass it.

-- Remove the over-permissive policy.
DROP POLICY IF EXISTS "Anyone can view proposals" ON proposals;

-- Owners can always see their own proposals.
CREATE POLICY "Owners can view their own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can see every proposal (needed for the review queue).
CREATE POLICY "Admins can view all proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Approved community additions remain browsable by any authenticated user,
-- but plaque_inquiry rows (which contain contact PII) are always excluded.
CREATE POLICY "Approved non-inquiry proposals are viewable"
  ON proposals FOR SELECT
  TO authenticated
  USING (status = 'approved' AND proposal_type <> 'plaque_inquiry');
