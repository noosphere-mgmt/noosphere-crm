-- Phase 39 (R1): Opportunity classification preferences for matching

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS property_category_preference TEXT NULL,
  ADD COLUMN IF NOT EXISTS property_type_preference TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_category_preference
  ON opportunities (property_category_preference)
  WHERE property_category_preference IS NOT NULL;
