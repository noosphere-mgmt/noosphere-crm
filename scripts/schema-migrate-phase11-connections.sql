-- Phase 11: Connections module — company fields, activities, last contact sync support

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS market_specializations TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS district TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_market_specializations
  ON companies USING GIN (market_specializations);

UPDATE companies
SET roles = (
  SELECT COALESCE(array_agg(DISTINCT mapped), '{}')
  FROM (
    SELECT CASE r
      WHEN 'property_management' THEN 'building_management'
      WHEN 'developer' THEN 'other'
      ELSE r
    END AS mapped
    FROM unnest(roles) AS r
  ) s
)
WHERE roles && ARRAY['property_management', 'developer']::TEXT[];

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS last_contact_date DATE NULL;

ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS last_contact_date DATE NULL;

CREATE TABLE IF NOT EXISTS activities (
  id                  BIGSERIAL PRIMARY KEY,
  activity_date       DATE NOT NULL,
  activity_type       TEXT NOT NULL,
  company_id          BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  contact_id          BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL,
  premises_id         TEXT NULL REFERENCES premises_v1(premises_id) ON DELETE SET NULL,
  opportunity_id      BIGINT NULL REFERENCES opportunities(id) ON DELETE SET NULL,
  notes               TEXT NULL,
  owner               TEXT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_company ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_company_date ON activities(company_id, activity_date DESC);

DROP TRIGGER IF EXISTS trg_activities_updated_at ON activities;
CREATE TRIGGER trg_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
