-- Contact relationships: agents, referring entities, etc.

CREATE TABLE IF NOT EXISTS contact_relationships (
  id                  BIGSERIAL PRIMARY KEY,
  contact_id          BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  related_company_id  BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  relationship_type   TEXT NOT NULL,
  notes               TEXT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contact_id, related_company_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_contact_relationships_contact ON contact_relationships(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_relationships_company ON contact_relationships(related_company_id);
