-- Phase 7: Import Workbench IW-1
BEGIN;

CREATE TABLE IF NOT EXISTS import_runs (
  id                BIGSERIAL PRIMARY KEY,
  session_id        TEXT NULL,
  import_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  object_type       TEXT NOT NULL CHECK (object_type IN (
                      'buildings','properties','offers',
                      'companies','contacts','opportunities'
                    )),
  filename          TEXT NOT NULL,
  uploaded_by       TEXT NOT NULL,
  source_system     TEXT NULL,
  source_file       TEXT NULL,
  source_date       DATE NULL,
  created_count     INTEGER NOT NULL DEFAULT 0,
  updated_count     INTEGER NOT NULL DEFAULT 0,
  cleared_count     INTEGER NOT NULL DEFAULT 0,
  skipped_count     INTEGER NOT NULL DEFAULT 0,
  error_count       INTEGER NOT NULL DEFAULT 0,
  duplicate_count   INTEGER NOT NULL DEFAULT 0,
  column_mapping    JSONB NOT NULL DEFAULT '{}',
  summary           JSONB NULL
);

CREATE INDEX IF NOT EXISTS idx_import_runs_date ON import_runs(import_date DESC);
CREATE INDEX IF NOT EXISTS idx_import_runs_object ON import_runs(object_type);

CREATE TABLE IF NOT EXISTS import_sessions (
  id                TEXT PRIMARY KEY,
  object_type       TEXT NOT NULL CHECK (object_type IN (
                      'buildings','properties','offers',
                      'companies','contacts','opportunities'
                    )),
  filename          TEXT NOT NULL,
  uploaded_by       TEXT NOT NULL,
  source_system     TEXT NULL,
  source_file       TEXT NULL,
  source_date       DATE NULL,
  status            TEXT NOT NULL DEFAULT 'mapping'
                    CHECK (status IN ('mapping','previewed','committed','cancelled')),
  csv_headers       JSONB NOT NULL DEFAULT '[]',
  column_mapping    JSONB NOT NULL DEFAULT '{}',
  row_count         INTEGER NOT NULL DEFAULT 0,
  parsed_rows       JSONB NOT NULL DEFAULT '[]',
  preview_summary   JSONB NULL,
  preview_rows      JSONB NULL,
  import_run_id     BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX IF NOT EXISTS idx_import_sessions_status ON import_sessions(status);
CREATE INDEX IF NOT EXISTS idx_import_sessions_expires ON import_sessions(expires_at);

CREATE TABLE IF NOT EXISTS import_run_rows (
  id                BIGSERIAL PRIMARY KEY,
  import_run_id     BIGINT NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,
  row_number        INTEGER NOT NULL,
  action            TEXT NOT NULL CHECK (action IN (
                      'create','update','clear_value','no_change',
                      'duplicate_candidate','error','skipped'
                    )),
  match_method      TEXT NULL,
  matched_id        BIGINT NULL,
  candidate_ids     BIGINT[] NULL,
  error_message     TEXT NULL,
  field_changes     JSONB NULL,
  raw_row           JSONB NULL
);

CREATE INDEX IF NOT EXISTS idx_import_run_rows_run ON import_run_rows(import_run_id);

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_file TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_date DATE NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_buildings_external_ref
  ON buildings(external_ref) WHERE external_ref IS NOT NULL;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_file TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_date DATE NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_external_ref
  ON companies(external_ref) WHERE external_ref IS NOT NULL;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS title TEXT NULL,
  ADD COLUMN IF NOT EXISTS lead_source TEXT NULL,
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_file TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_date DATE NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

COMMIT;
