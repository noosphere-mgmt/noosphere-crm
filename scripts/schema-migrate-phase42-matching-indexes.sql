-- Phase 42 (R2): Composite indexes for premises matching queries

CREATE INDEX IF NOT EXISTS idx_premises_v1_match_category_status
  ON premises_v1 (property_category, inventory_status)
  WHERE property_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_premises_v1_match_listing_intent
  ON premises_v1 (listing_intent)
  WHERE listing_intent IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_v1_district_en
  ON properties_v1 (district_en)
  WHERE district_en IS NOT NULL;
