-- Phase 20: Opportunity sales role (To Lease / To Buy) and buy-side requirement fields

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS sales_role TEXT NOT NULL DEFAULT 'to_lease',
  ADD COLUMN IF NOT EXISTS property_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS target_yield TEXT NULL,
  ADD COLUMN IF NOT EXISTS funding_status TEXT NULL;

UPDATE opportunities
SET property_type = workspace_type
WHERE property_type IS NULL AND workspace_type IS NOT NULL;
