-- Phase 43 (R3): Proposal generator on legacy opportunities

CREATE TABLE IF NOT EXISTS opportunity_proposals (
  id                       BIGSERIAL PRIMARY KEY,
  opportunity_id           BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  title                    TEXT NOT NULL,
  proposal_date            DATE NULL,
  language                 TEXT NOT NULL DEFAULT 'en'
                           CHECK (language IN ('en', 'zh-Hant', 'zh-Hans')),
  status                   TEXT NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'sent', 'accepted', 'superseded')),
  version_number           INTEGER NOT NULL DEFAULT 1,
  supersedes_id            BIGINT NULL REFERENCES opportunity_proposals(id) ON DELETE SET NULL,
  prepared_for_company_id  BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  prepared_for_contact_id  BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL,
  template_key             TEXT NOT NULL DEFAULT 'default',
  executive_summary        TEXT NULL,
  consultancy_advice       TEXT NULL,
  output_file              TEXT NULL,
  sent_date                DATE NULL,
  remarks                  TEXT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunity_proposals_opp
  ON opportunity_proposals (opportunity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunity_proposals_supersedes
  ON opportunity_proposals (supersedes_id)
  WHERE supersedes_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_opportunity_proposals_updated_at ON opportunity_proposals;
CREATE TRIGGER trg_opportunity_proposals_updated_at
BEFORE UPDATE ON opportunity_proposals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS opportunity_proposal_items (
  id                   BIGSERIAL PRIMARY KEY,
  proposal_id          BIGINT NOT NULL REFERENCES opportunity_proposals(id) ON DELETE CASCADE,
  premises_id          TEXT NOT NULL REFERENCES premises_v1(premises_id) ON DELETE RESTRICT,
  proposed_premises_id BIGINT NULL REFERENCES opportunity_proposed_premises(id) ON DELETE SET NULL,
  rank                 INTEGER NULL,
  recommended          BOOLEAN NOT NULL DEFAULT FALSE,
  recommendation_label TEXT NULL,
  display_rent         TEXT NULL,
  net_effective_rent   NUMERIC(14, 2) NULL,
  total_initial_cost   NUMERIC(14, 2) NULL,
  pros                 TEXT NULL,
  cons                 TEXT NULL,
  advisor_comment      TEXT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (proposal_id, premises_id)
);

CREATE INDEX IF NOT EXISTS idx_opportunity_proposal_items_proposal
  ON opportunity_proposal_items (proposal_id, rank);

DROP TRIGGER IF EXISTS trg_opportunity_proposal_items_updated_at ON opportunity_proposal_items;
CREATE TRIGGER trg_opportunity_proposal_items_updated_at
BEFORE UPDATE ON opportunity_proposal_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
