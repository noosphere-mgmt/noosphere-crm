-- Connections UI: location fields on companies, structured contact names

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Hong Kong',
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Hong Kong';

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS first_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS last_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS chinese_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS display_name TEXT NULL;

UPDATE contacts
SET display_name = contact_name
WHERE display_name IS NULL AND contact_name IS NOT NULL;

UPDATE contacts
SET
  first_name = CASE
    WHEN position(' ' IN contact_name) > 0 THEN split_part(contact_name, ' ', 1)
    ELSE contact_name
  END,
  last_name = CASE
    WHEN position(' ' IN contact_name) > 0 THEN NULLIF(trim(substring(contact_name FROM position(' ' IN contact_name) + 1)), '')
    ELSE NULL
  END
WHERE first_name IS NULL AND contact_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);
CREATE INDEX IF NOT EXISTS idx_contacts_display_name ON contacts(display_name);
