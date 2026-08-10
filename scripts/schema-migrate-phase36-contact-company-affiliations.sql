-- Phase 36: Contact ↔ Company affiliations (many companies per contact)
-- Keeps contacts.company_id as denormalized primary for backwards compatibility.

BEGIN;

ALTER TABLE contacts
  ALTER COLUMN company_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS contact_company_affiliations (
  id            BIGSERIAL PRIMARY KEY,
  contact_id    BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id    BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_title     TEXT NULL,
  role          TEXT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  start_date    DATE NULL,
  end_date      DATE NULL,
  notes         TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contact_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_company_affiliations_contact
  ON contact_company_affiliations(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_company_affiliations_company
  ON contact_company_affiliations(company_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_company_affiliations_one_primary
  ON contact_company_affiliations(contact_id)
  WHERE is_primary = TRUE;

-- Backfill from existing primary company FK
INSERT INTO contact_company_affiliations (contact_id, company_id, job_title, is_primary)
SELECT c.id, c.company_id, c.title, TRUE
FROM contacts c
WHERE c.company_id IS NOT NULL
ON CONFLICT (contact_id, company_id) DO NOTHING;

COMMIT;
