-- Safe column backfill for legacy databases (must run before schema.sql indexes).
-- contacts.contact_role: TEXT[] multi-select (same values as company roles)
-- opportunities.lead_type: TEXT enum-like value

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS contact_role TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'direct_client';

CREATE INDEX IF NOT EXISTS idx_contacts_contact_role ON contacts USING GIN (contact_role);
CREATE INDEX IF NOT EXISTS idx_opportunities_lead_type ON opportunities(lead_type);
