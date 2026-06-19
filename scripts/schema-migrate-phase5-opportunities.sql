-- Phase 5: Opportunities (client requirements)
BEGIN;

CREATE TABLE IF NOT EXISTS opportunities (
  id                    BIGSERIAL PRIMARY KEY,
  client_name           TEXT NOT NULL,
  company_name          TEXT NULL,
  budget_min            NUMERIC(14, 2) NULL,
  budget_max            NUMERIC(14, 2) NULL,
  required_area_sqft    NUMERIC(12, 2) NULL,
  required_capacity_pax INTEGER NULL,
  district_preference   TEXT NULL,
  workspace_type        TEXT NULL,
  move_in_date          DATE NULL,
  status                TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN (
                          'new', 'qualifying', 'sourcing', 'proposal_preparing',
                          'proposal_sent', 'negotiating', 'closed_won', 'closed_lost'
                        )),
  requirement_summary   TEXT NULL,
  remarks               TEXT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_client ON opportunities(client_name);
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_name);

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON opportunities;
CREATE TRIGGER trg_opportunities_updated_at
BEFORE UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
