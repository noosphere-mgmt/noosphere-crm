-- Phase 8: Inventory company links (Property Portfolio)
BEGIN;

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS operator_company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS landlord_company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_tenant_company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_operator_company ON assets(operator_company_id);
CREATE INDEX IF NOT EXISTS idx_assets_landlord_company ON assets(landlord_company_id);
CREATE INDEX IF NOT EXISTS idx_assets_tenant_company ON assets(current_tenant_company_id);

COMMIT;
