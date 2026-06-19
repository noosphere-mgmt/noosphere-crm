-- Phase 18: Opportunity workspace — proposed premises, parties, source fields

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS source_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS lease_term TEXT NULL,
  ADD COLUMN IF NOT EXISTS referrer_contact_id BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_referrer_contact ON opportunities(referrer_contact_id);

CREATE TABLE IF NOT EXISTS opportunity_proposed_premises (
  id                          BIGSERIAL PRIMARY KEY,
  opportunity_id              BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  premises_id                 TEXT NOT NULL,
  rank                        INTEGER NULL,
  preference                  TEXT NULL
                              CHECK (preference IS NULL OR preference IN ('high', 'medium', 'low')),
  status                      TEXT NOT NULL DEFAULT 'proposed'
                              CHECK (status IN (
                                'proposed', 'presented', 'shortlisted', 'viewing',
                                'negotiation', 'rejected', 'selected', 'won', 'lost'
                              )),
  proposed_date               DATE NULL,
  proposed_price              NUMERIC(14, 2) NULL,
  proposed_price_psf          NUMERIC(14, 4) NULL,
  client_comment              TEXT NULL,
  advisor_comment             TEXT NULL,
  remarks                     TEXT NULL,
  related_company_id          BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  related_contact_id          BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL,
  related_role                TEXT NULL,
  partnership_mode            TEXT NULL,
  collect_fee_amount          NUMERIC(14, 2) NULL,
  collect_fee_basis           TEXT NULL,
  collect_fee_from_company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  collect_fee_status          TEXT NULL,
  paid_out_fee_amount         NUMERIC(14, 2) NULL,
  paid_out_fee_basis          TEXT NULL,
  paid_out_to_company_id      BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  paid_out_status             TEXT NULL,
  fee_remarks                 TEXT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, premises_id)
);

CREATE INDEX IF NOT EXISTS idx_opp_proposed_premises_opp ON opportunity_proposed_premises(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_proposed_premises_premises ON opportunity_proposed_premises(premises_id);

DROP TRIGGER IF EXISTS trg_opp_proposed_premises_updated_at ON opportunity_proposed_premises;
CREATE TRIGGER trg_opp_proposed_premises_updated_at
BEFORE UPDATE ON opportunity_proposed_premises
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS opportunity_parties (
  id                BIGSERIAL PRIMARY KEY,
  opportunity_id    BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  company_id        BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id        BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL,
  role              TEXT NOT NULL,
  partnership_mode  TEXT NULL,
  fee_note          TEXT NULL,
  remarks           TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_parties_opp ON opportunity_parties(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_parties_company ON opportunity_parties(company_id);

DROP TRIGGER IF EXISTS trg_opportunity_parties_updated_at ON opportunity_parties;
CREATE TRIGGER trg_opportunity_parties_updated_at
BEFORE UPDATE ON opportunity_parties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
