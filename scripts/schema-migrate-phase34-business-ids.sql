-- Phase 34: Permanent business IDs (C100001, B100001, P100001, D100001, M100001, A100001)
-- Adds business_id columns and crosswalk; does not drop legacy PKs or deprecated IDs.

BEGIN;

CREATE TABLE IF NOT EXISTS business_id_crosswalk (
  entity_type     TEXT NOT NULL,
  business_id     TEXT NOT NULL,
  primary_ref     TEXT NOT NULL,
  deprecated_ref  TEXT NULL,
  legacy_numeric  BIGINT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_type, business_id),
  UNIQUE (entity_type, primary_ref)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_id_crosswalk_deprecated
  ON business_id_crosswalk (entity_type, deprecated_ref)
  WHERE deprecated_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_id_crosswalk_legacy
  ON business_id_crosswalk (entity_type, legacy_numeric)
  WHERE legacy_numeric IS NOT NULL;

ALTER TABLE companies_v1
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

ALTER TABLE properties_v1
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

ALTER TABLE contacts_v1
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

ALTER TABLE opportunities_v1
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS business_id TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_v1_business_id
  ON companies_v1 (business_id) WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_v1_business_id
  ON properties_v1 (business_id) WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_premises_v1_business_id
  ON premises_v1 (business_id) WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_v1_business_id
  ON contacts_v1 (business_id) WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_v1_business_id
  ON opportunities_v1 (business_id) WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_business_id
  ON companies (business_id) WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_business_id
  ON contacts (business_id) WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_business_id
  ON opportunities (business_id) WHERE business_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_business_id
  ON activities (business_id) WHERE business_id IS NOT NULL;

COMMIT;
