-- Phase 10b: Building header fields on properties_v1 (additive only).

BEGIN;

ALTER TABLE properties_v1
  ADD COLUMN IF NOT EXISTS grade TEXT NULL,
  ADD COLUMN IF NOT EXISTS management_company_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS title TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_v1_management_company
  ON properties_v1(management_company_id);

COMMIT;
