-- Phase 6: CRM-1 — Companies, Contacts, Opportunity FKs
BEGIN;

CREATE TABLE IF NOT EXISTS companies (
  id                      BIGSERIAL PRIMARY KEY,
  company_name            TEXT NOT NULL,
  company_name_zh         TEXT NULL,
  roles                   TEXT[] NOT NULL DEFAULT '{}',
  website                 TEXT NULL,
  phone                   TEXT NULL,
  email                   TEXT NULL,
  industry                TEXT NULL,
  source                  TEXT NULL,
  relationship_owner      TEXT NULL,
  last_contact_date       DATE NULL,
  last_meeting_date       DATE NULL,
  next_follow_up_date     DATE NULL,
  relationship_strength   TEXT NULL
                          CHECK (relationship_strength IS NULL OR relationship_strength IN (
                            'cold', 'warm', 'active', 'strategic'
                          )),
  notes                   TEXT NULL,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_roles ON companies USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_companies_next_follow_up ON companies(next_follow_up_date);

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS contacts (
  id                    BIGSERIAL PRIMARY KEY,
  company_id            BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_name          TEXT NOT NULL,
  title                 TEXT NULL,
  email                 TEXT NULL,
  phone                 TEXT NULL,
  whatsapp              TEXT NULL,
  wechat                TEXT NULL,
  preferred_language    TEXT NULL,
  is_primary            BOOLEAN NOT NULL DEFAULT FALSE,
  last_contact_date     DATE NULL,
  next_follow_up_date   DATE NULL,
  notes                 TEXT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(contact_name);
CREATE INDEX IF NOT EXISTS idx_contacts_primary ON contacts(company_id, is_primary) WHERE is_primary = TRUE;

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS primary_contact_id BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referrer_company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_close_date DATE NULL,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS relationship_owner TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_primary_contact ON opportunities(primary_contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_referrer ON opportunities(referrer_company_id);

COMMIT;
