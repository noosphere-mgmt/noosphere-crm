-- Add Contact Role (multi-select) to contacts

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS contact_role TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_contacts_contact_role ON contacts USING GIN (contact_role);

