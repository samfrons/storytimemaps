-- Migration 002: Plaque Inquiries
--
-- Adds support for "I'm the building owner" plaque inquiry submissions
-- on every business listing page. Anonymous (unauthenticated) submissions
-- land in the existing `proposals` table with proposal_type='plaque_inquiry'
-- so admins can review them in the existing /admin/proposals UI.
--
-- The /api/plaque-inquiry route uses the SUPABASE_SERVICE_ROLE_KEY to
-- bypass RLS for inserts. RLS still gates reads/updates as before.
--
-- Note: ALTER TYPE ... ADD VALUE cannot be used in the same transaction
-- as INSERTs that reference the new value, but DDL changes against
-- columns/policies are fine.

-- Extend the proposal_type enum with 'plaque_inquiry'
ALTER TYPE proposal_type ADD VALUE IF NOT EXISTS 'plaque_inquiry';

-- Allow anonymous (NULL user_id) plaque_inquiry rows.
-- Existing authenticated proposal flows still set user_id from auth.uid().
ALTER TABLE proposals ALTER COLUMN user_id DROP NOT NULL;

-- Add optional contact columns used only by plaque_inquiry rows.
-- Kept nullable so existing authenticated proposal flows are unaffected.
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS inquiry_name  TEXT,
  ADD COLUMN IF NOT EXISTS inquiry_email TEXT,
  ADD COLUMN IF NOT EXISTS inquiry_phone TEXT,
  ADD COLUMN IF NOT EXISTS building_role TEXT;

-- Index on proposal_type to make the admin filter fast.
CREATE INDEX IF NOT EXISTS idx_proposals_proposal_type ON proposals(proposal_type);
