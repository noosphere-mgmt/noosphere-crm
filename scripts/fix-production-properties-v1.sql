-- Emergency idempotent patch: properties_v1 columns required by Buildings page.
-- Prefer: npm run db:migrate (runs phase 31).
-- Each statement auto-commits (no wrapping transaction).

ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS management_company_id TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS operator_company_id TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS current_tenant_company_id TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS owner_company_id TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'HKD';
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS external_ref TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS import_run_id BIGINT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS last_verified_date DATE;
