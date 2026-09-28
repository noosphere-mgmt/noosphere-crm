-- Phase 86: Attach an agency company to the companies it covers.
-- Contacts are not copied. An agent remains one contact of the agency.

CREATE TABLE IF NOT EXISTS company_agencies (
  id                 BIGSERIAL PRIMARY KEY,
  company_id         BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  agency_company_id  BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, agency_company_id),
  CHECK (company_id <> agency_company_id)
);

CREATE INDEX IF NOT EXISTS idx_company_agencies_company ON company_agencies(company_id);
CREATE INDEX IF NOT EXISTS idx_company_agencies_agency ON company_agencies(agency_company_id);

DROP TRIGGER IF EXISTS trg_company_agencies_updated_at ON company_agencies;
CREATE TRIGGER trg_company_agencies_updated_at
BEFORE UPDATE ON company_agencies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
