-- Phase 32: Import/export schema alignment — ensure columns referenced by export adapters exist.
-- Note: paid_out_status is the canonical DB column; export CSV field is paid_out_fee_status (adapter alias).

ALTER TABLE opportunity_proposed_premises
  ADD COLUMN IF NOT EXISTS tour_date DATE NULL,
  ADD COLUMN IF NOT EXISTS collect_fee_amount NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS collect_fee_status TEXT NULL,
  ADD COLUMN IF NOT EXISTS paid_out_fee_amount NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS paid_out_status TEXT NULL,
  ADD COLUMN IF NOT EXISTS fee_remarks TEXT NULL,
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

ALTER TABLE opportunity_parties
  ADD COLUMN IF NOT EXISTS collect_fee_amount NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS collect_fee_percent NUMERIC(8, 4) NULL,
  ADD COLUMN IF NOT EXISTS paid_out_fee_amount NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS paid_out_fee_percent NUMERIC(8, 4) NULL,
  ADD COLUMN IF NOT EXISTS collect_fee_status TEXT NULL,
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

ALTER TABLE properties_v1
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_verified_date DATE NULL,
  ADD COLUMN IF NOT EXISTS management_company_id TEXT NULL;

ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS operator_company_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS owner_company_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS last_verified_date DATE NULL;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS primary_contact_id BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lease_term TEXT NULL;

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activity_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS activity_time TEXT NULL,
  ADD COLUMN IF NOT EXISTS premises_id TEXT NULL;

ALTER TABLE relationships
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;
