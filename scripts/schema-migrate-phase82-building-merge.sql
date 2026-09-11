-- Phase 82: Safe Building merge (archive duplicate, keep master, audit trail).
-- Canonical building entity is properties_v1. Do not hard-delete the source record.

ALTER TABLE properties_v1
  ADD COLUMN IF NOT EXISTS merged_into_property_id TEXT NULL REFERENCES properties_v1(property_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS merged_by TEXT NULL,
  ADD COLUMN IF NOT EXISTS search_aliases TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_properties_v1_merged_into
  ON properties_v1(merged_into_property_id)
  WHERE merged_into_property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_v1_search_aliases
  ON properties_v1 USING GIN (search_aliases);

CREATE TABLE IF NOT EXISTS building_merge_audit (
  id                      BIGSERIAL PRIMARY KEY,
  master_property_id      TEXT NOT NULL,
  master_business_id      TEXT NULL,
  duplicate_property_id   TEXT NOT NULL,
  duplicate_business_id   TEXT NULL,
  merged_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  merged_by               TEXT NULL,
  relationship_counts     JSONB NOT NULL DEFAULT '{}'::jsonb,
  field_resolutions       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_building_merge_audit_master
  ON building_merge_audit(master_property_id, merged_at DESC);

CREATE INDEX IF NOT EXISTS idx_building_merge_audit_duplicate
  ON building_merge_audit(duplicate_property_id);
