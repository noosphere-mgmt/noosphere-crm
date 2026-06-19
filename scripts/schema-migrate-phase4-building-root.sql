-- Phase 4 (Phase B): merge site/address into buildings; building becomes root record
BEGIN;

ALTER TABLE buildings ADD COLUMN IF NOT EXISTS name_en TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS name_zh TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS property_type TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS centre_type TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS status TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS country TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS city TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS district TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS street_no TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS street_name_en TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS street_name_zh TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS full_address_en TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS full_address_zh TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS lot_number TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS land_use TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS ownership_type TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS source_url TEXT NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS last_verified_date DATE NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION NULL;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buildings' AND column_name = 'property_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_deprecated_sites'
  ) THEN
    UPDATE buildings b
    SET
      name_en = COALESCE(b.name_en, p.name_en),
      name_zh = COALESCE(b.name_zh, p.name_zh),
      property_type = COALESCE(b.property_type, p.property_type),
      centre_type = COALESCE(b.centre_type, p.centre_type),
      status = COALESCE(b.status, p.status),
      country = COALESCE(b.country, p.country),
      city = COALESCE(b.city, p.city),
      district = COALESCE(b.district, p.district),
      street_no = COALESCE(b.street_no, p.street_no),
      street_name_en = COALESCE(b.street_name_en, p.street_name_en),
      street_name_zh = COALESCE(b.street_name_zh, p.street_name_zh),
      full_address_en = COALESCE(b.full_address_en, p.full_address_en),
      full_address_zh = COALESCE(b.full_address_zh, p.full_address_zh),
      lot_number = COALESCE(b.lot_number, p.lot_number),
      land_use = COALESCE(b.land_use, p.land_use),
      ownership_type = COALESCE(b.ownership_type, p.ownership_type),
      source_url = COALESCE(b.source_url, p.source_url),
      last_verified_date = COALESCE(b.last_verified_date, p.last_verified_date),
      latitude = COALESCE(b.latitude, p.latitude),
      longitude = COALESCE(b.longitude, p.longitude)
    FROM _deprecated_sites p
    WHERE b.property_id = p.id;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buildings' AND column_name = 'property_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'name_en'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'building_id'
  ) THEN
    UPDATE buildings b
    SET
      name_en = COALESCE(b.name_en, p.name_en),
      name_zh = COALESCE(b.name_zh, p.name_zh),
      property_type = COALESCE(b.property_type, p.property_type),
      centre_type = COALESCE(b.centre_type, p.centre_type),
      status = COALESCE(b.status, p.status),
      country = COALESCE(b.country, p.country),
      city = COALESCE(b.city, p.city),
      district = COALESCE(b.district, p.district),
      street_no = COALESCE(b.street_no, p.street_no),
      street_name_en = COALESCE(b.street_name_en, p.street_name_en),
      street_name_zh = COALESCE(b.street_name_zh, p.street_name_zh),
      full_address_en = COALESCE(b.full_address_en, p.full_address_en),
      full_address_zh = COALESCE(b.full_address_zh, p.full_address_zh),
      lot_number = COALESCE(b.lot_number, p.lot_number),
      land_use = COALESCE(b.land_use, p.land_use),
      ownership_type = COALESCE(b.ownership_type, p.ownership_type),
      source_url = COALESCE(b.source_url, p.source_url),
      last_verified_date = COALESCE(b.last_verified_date, p.last_verified_date),
      latitude = COALESCE(b.latitude, p.latitude),
      longitude = COALESCE(b.longitude, p.longitude)
    FROM properties p
    WHERE b.property_id = p.id;
  END IF;
END $$;

UPDATE buildings
SET name_en = COALESCE(
      NULLIF(trim(name_en), ''),
      NULLIF(trim(tower_block), ''),
      'Building #' || id::text
    ),
    country = COALESCE(country, 'Hong Kong'),
    city = COALESCE(city, 'Hong Kong'),
    district = COALESCE(district, ''),
    full_address_en = COALESCE(full_address_en, ''),
    property_type = COALESCE(property_type, 'Commercial Building'),
    status = COALESCE(status, 'active')
WHERE name_en IS NULL OR trim(name_en) = '';

ALTER TABLE buildings ALTER COLUMN name_en SET NOT NULL;
ALTER TABLE buildings ALTER COLUMN country SET DEFAULT 'Hong Kong';
ALTER TABLE buildings ALTER COLUMN city SET DEFAULT 'Hong Kong';
ALTER TABLE buildings ALTER COLUMN district SET DEFAULT '';
ALTER TABLE buildings ALTER COLUMN full_address_en SET DEFAULT '';
ALTER TABLE buildings ALTER COLUMN property_type SET DEFAULT 'Commercial Building';
ALTER TABLE buildings ALTER COLUMN status SET DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buildings_status_check'
  ) THEN
    ALTER TABLE buildings ADD CONSTRAINT buildings_status_check
      CHECK (status IN ('active', 'inactive', 'archived'));
  END IF;
END $$;

ALTER TABLE buildings ALTER COLUMN property_id DROP NOT NULL;

ALTER TABLE assets ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE inventory ALTER COLUMN property_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_buildings_district ON buildings(district);
CREATE INDEX IF NOT EXISTS idx_buildings_name ON buildings(name_en);

COMMIT;
