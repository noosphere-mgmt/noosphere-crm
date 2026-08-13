-- Phase 72: Lead Source alignment + Required Type / Subtype (same as opportunities).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_category_preference TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_type_preference TEXT;

UPDATE leads
SET source = 'emarketing'
WHERE lower(trim(coalesce(source, ''))) IN ('email', 'e_marketing', 'email_marketing');

UPDATE leads
SET source = 'partner_agents'
WHERE lower(trim(coalesce(source, ''))) IN ('partner_agent', 'partner agents', 'referral');

UPDATE leads
SET source = 'direct'
WHERE source IS NULL
   OR trim(source) = ''
   OR lower(trim(source)) NOT IN ('direct', 'partner_agents', 'emarketing');

ALTER TABLE leads ALTER COLUMN source SET DEFAULT 'direct';

CREATE INDEX IF NOT EXISTS leads_source_idx ON leads(source);
CREATE INDEX IF NOT EXISTS leads_required_type_idx ON leads(property_category_preference);
CREATE INDEX IF NOT EXISTS leads_location_idx ON leads(preferred_location);
