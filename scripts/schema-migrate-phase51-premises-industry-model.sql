ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS asset_class TEXT,
  ADD COLUMN IF NOT EXISTS asset_scope TEXT,
  ADD COLUMN IF NOT EXISTS product_subtype TEXT,
  ADD COLUMN IF NOT EXISTS whole_asset_type TEXT,
  ADD COLUMN IF NOT EXISTS market_mode TEXT,
  ADD COLUMN IF NOT EXISTS occupancy_status TEXT,
  ADD COLUMN IF NOT EXISTS availability_status TEXT,
  ADD COLUMN IF NOT EXISTS discovery_status TEXT,
  ADD COLUMN IF NOT EXISTS access_status TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS address_confidence TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

UPDATE premises_v1
SET asset_class = CASE
      WHEN property_type = 'Residential' OR property_category = 'Residential' THEN 'residential'
      WHEN property_type = 'Industrial' OR property_category = 'Industrial' THEN 'industrial'
      WHEN property_type = 'Land' OR space_form = 'Land' THEN 'land'
      WHEN property_type IS NULL AND property_category IS NULL THEN 'unknown'
      ELSE 'commercial'
    END
WHERE asset_class IS NULL;

UPDATE premises_v1
SET asset_scope = CASE
      WHEN space_form = 'Land' THEN 'land'
      WHEN space_form IN ('En-bloc', 'Building', 'Portfolio') OR offer_type IN ('Enbloc', 'Portfolio') THEN 'whole_building'
      WHEN space_form IS NULL AND floor IS NULL AND unit IS NULL THEN 'unknown'
      ELSE 'unit'
    END
WHERE asset_scope IS NULL;

UPDATE premises_v1
SET product_subtype = CASE
      WHEN asset_class = 'residential' AND operating_model = 'Serviced Apartment' THEN 'serviced_unit'
      WHEN asset_class = 'residential' AND operating_model = 'Shared Office' THEN 'shared_flat'
      WHEN asset_class = 'residential' THEN 'flat'
      WHEN asset_class = 'industrial' THEN 'industrial_unit'
      WHEN asset_class = 'land' THEN 'land'
      WHEN property_category = 'Retail' OR property_type = 'Retails' THEN 'shop_retail'
      WHEN operating_model = 'Serviced Office' OR property_category = 'Serviced Office' THEN 'serviced_office'
      WHEN operating_model = 'Shared Office' OR property_category = 'Shared Office' THEN 'shared_sublet_office'
      WHEN asset_class = 'commercial' THEN 'conventional_office'
      ELSE NULL
    END
WHERE product_subtype IS NULL;

UPDATE premises_v1
SET market_mode = CASE
      WHEN listing_intent = 'both' THEN 'lease_or_sale'
      WHEN listing_intent = 'sale' OR inventory_status = 'For Sale' THEN 'sale'
      WHEN listing_intent = 'lease' OR inventory_status = 'For Lease' THEN 'lease'
      ELSE 'unknown'
    END
WHERE market_mode IS NULL;

UPDATE premises_v1
SET availability_status = CASE offer_status
      WHEN 'Available' THEN 'available'
      WHEN 'Leased' THEN 'not_available'
      WHEN 'Sold' THEN 'not_available'
      WHEN 'Withdrawn' THEN 'not_available'
      ELSE 'unknown'
    END
WHERE availability_status IS NULL;

UPDATE premises_v1 SET occupancy_status = 'unknown' WHERE occupancy_status IS NULL;
UPDATE premises_v1 SET discovery_status = 'identified' WHERE discovery_status IS NULL;
UPDATE premises_v1 SET access_status = 'no_contact' WHERE access_status IS NULL;
UPDATE premises_v1 SET source_type = CASE WHEN source_file IS NOT NULL THEN 'import' ELSE 'other' END WHERE source_type IS NULL;
UPDATE premises_v1 SET address_confidence = CASE WHEN property_id IS NOT NULL THEN 'building_confirmed' ELSE 'unknown' END WHERE address_confidence IS NULL;
UPDATE premises_v1 SET last_verified_at = last_verified_date::timestamptz WHERE last_verified_at IS NULL AND last_verified_date IS NOT NULL;
