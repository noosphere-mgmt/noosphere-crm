-- Rename Market Specialization → Coverage on companies; add Coverage to contacts

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'market_specializations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'coverage'
  ) THEN
    ALTER TABLE companies RENAME COLUMN market_specializations TO coverage;
  END IF;
END $$;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS coverage TEXT[] NOT NULL DEFAULT '{}';

DROP INDEX IF EXISTS idx_companies_market_specializations;
CREATE INDEX IF NOT EXISTS idx_companies_coverage ON companies USING GIN (coverage);

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS coverage TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_contacts_coverage ON contacts USING GIN (coverage);
