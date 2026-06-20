-- Phase 10c: Property-level company links (additive only).

BEGIN;

ALTER TABLE properties_v1
  ADD COLUMN IF NOT EXISTS operator_company_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS current_tenant_company_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS owner_company_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_v1_operator_company
  ON properties_v1(operator_company_id);
CREATE INDEX IF NOT EXISTS idx_properties_v1_current_tenant_company
  ON properties_v1(current_tenant_company_id);
CREATE INDEX IF NOT EXISTS idx_properties_v1_owner_company
  ON properties_v1(owner_company_id);

COMMIT;
