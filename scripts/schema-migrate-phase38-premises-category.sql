-- Phase 38 (R1): Premises classification — property_category, listing_intent, space_form

ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS property_category TEXT NULL,
  ADD COLUMN IF NOT EXISTS listing_intent TEXT NULL
    CHECK (listing_intent IS NULL OR listing_intent IN ('lease', 'sale', 'both')),
  ADD COLUMN IF NOT EXISTS space_form TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_premises_v1_category
  ON premises_v1 (property_category)
  WHERE property_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_premises_v1_listing_intent
  ON premises_v1 (listing_intent)
  WHERE listing_intent IS NOT NULL;
