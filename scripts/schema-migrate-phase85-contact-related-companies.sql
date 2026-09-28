-- Phase 85: Contact ↔ related companies.
-- contacts.company_id remains the single primary company. This table does not
-- copy, replace, or update existing primary-company links.

CREATE TABLE IF NOT EXISTS contact_related_companies (
  id                 BIGSERIAL PRIMARY KEY,
  contact_id         BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  company_id         BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  relationship_role  TEXT NOT NULL,
  notes              TEXT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contact_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_related_companies_contact
  ON contact_related_companies(contact_id);

CREATE INDEX IF NOT EXISTS idx_contact_related_companies_company
  ON contact_related_companies(company_id);

DROP TRIGGER IF EXISTS trg_contact_related_companies_updated_at ON contact_related_companies;
CREATE TRIGGER trg_contact_related_companies_updated_at
BEFORE UPDATE ON contact_related_companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
