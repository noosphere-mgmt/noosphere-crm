-- Phase 27: Import workbench expansion — object types, provenance columns, text matched IDs

ALTER TABLE import_runs DROP CONSTRAINT IF EXISTS import_runs_object_type_check;
ALTER TABLE import_sessions DROP CONSTRAINT IF EXISTS import_sessions_object_type_check;

ALTER TABLE import_runs ADD CONSTRAINT import_runs_object_type_check CHECK (object_type IN (
  'buildings', 'premises', 'companies', 'contacts', 'relationships',
  'opportunities', 'opportunity_parties', 'opportunity_proposed_premises',
  'activities', 'activity_premises'
));

ALTER TABLE import_sessions ADD CONSTRAINT import_sessions_object_type_check CHECK (object_type IN (
  'buildings', 'premises', 'companies', 'contacts', 'relationships',
  'opportunities', 'opportunity_parties', 'opportunity_proposed_premises',
  'activities', 'activity_premises'
));

ALTER TABLE import_run_rows
  ADD COLUMN IF NOT EXISTS matched_record_id TEXT NULL;

ALTER TABLE properties_v1
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_verified_date DATE NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_v1_external_ref
  ON properties_v1(external_ref) WHERE external_ref IS NOT NULL;

ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_premises_v1_external_ref
  ON premises_v1(external_ref) WHERE external_ref IS NOT NULL;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_external_ref
  ON contacts(external_ref) WHERE external_ref IS NOT NULL;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS primary_contact_id BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE relationships
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

ALTER TABLE opportunity_parties
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

ALTER TABLE opportunity_proposed_premises
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;
