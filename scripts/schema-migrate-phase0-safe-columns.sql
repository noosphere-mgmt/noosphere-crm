-- Safe column backfill for legacy databases.
-- Skips when tables do not exist yet (fresh npm run db:migrate on empty DB).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name = 'contacts'
  ) THEN
    ALTER TABLE contacts
      ADD COLUMN IF NOT EXISTS contact_role TEXT[] NOT NULL DEFAULT '{}';
    CREATE INDEX IF NOT EXISTS idx_contacts_contact_role ON contacts USING GIN (contact_role);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name = 'opportunities'
  ) THEN
    ALTER TABLE opportunities
      ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'direct_client';
    CREATE INDEX IF NOT EXISTS idx_opportunities_lead_type ON opportunities(lead_type);
  END IF;
END $$;
