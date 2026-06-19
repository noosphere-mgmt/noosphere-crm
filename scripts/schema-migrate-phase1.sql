-- Phase 1 schema correction: Property → Building → Inventory
-- Idempotent for local development. Skips when already migrated.
BEGIN;

DO $$
DECLARE
  r RECORD;
  v_property_id BIGINT;
  v_building_id BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'buildings' AND column_name = 'name'
  ) THEN
    RAISE NOTICE 'Phase 1 migration: legacy schema not detected, skipping data migration.';
    RETURN;
  END IF;

  RAISE NOTICE 'Phase 1 migration: converting legacy schema…';

  ALTER TABLE inventory RENAME TO inventory_legacy;
  ALTER TABLE properties RENAME TO properties_legacy;
  ALTER TABLE buildings RENAME TO buildings_legacy;

  CREATE TABLE properties (
    id               BIGSERIAL PRIMARY KEY,
    name_en          TEXT NOT NULL,
    name_zh          TEXT NULL,
    property_type    TEXT NOT NULL DEFAULT 'Commercial Building',
    centre_type      TEXT NULL,
    status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'inactive', 'archived')),
    country          TEXT NOT NULL DEFAULT 'Hong Kong',
    city             TEXT NOT NULL DEFAULT 'Hong Kong',
    district         TEXT NOT NULL DEFAULT '',
    full_address_en  TEXT NOT NULL DEFAULT '',
    full_address_zh  TEXT NULL,
    latitude         DOUBLE PRECISION NULL,
    longitude        DOUBLE PRECISION NULL,
    remarks          TEXT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE buildings (
    id                      BIGSERIAL PRIMARY KEY,
    property_id             BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tower_block             TEXT NULL,
    floor_count             INTEGER NULL,
    typical_floor_area_sqft NUMERIC(12, 2) NULL,
    remarks                 TEXT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE inventory (
    id              BIGSERIAL PRIMARY KEY,
    property_id     BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    building_id     BIGINT NULL REFERENCES buildings(id) ON DELETE SET NULL,
    operator_id     BIGINT NULL REFERENCES operators(id) ON DELETE SET NULL,
    offer_type      TEXT NOT NULL DEFAULT 'Unit'
                    CHECK (offer_type IN ('Unit', 'Floor', 'Enbloc', 'Serviced Office', 'Shared Office')),
    status          TEXT NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available', 'proposed', 'leased', 'withdrawn')),
    floor           TEXT NULL,
    unit            TEXT NULL,
    office_name     TEXT NULL,
    office_type     TEXT NULL,
    capacity_pax    INTEGER NULL,
    gross_area_sqft NUMERIC(12, 2) NULL,
    net_area_sqft   NUMERIC(12, 2) NULL,
    monthly_rent    NUMERIC(14, 2) NULL,
    available_date  DATE NULL,
    listing_intent  TEXT NOT NULL DEFAULT 'lease'
                    CHECK (listing_intent IN ('lease', 'sale')),
    sale_price      NUMERIC(14, 2) NULL,
    remarks         TEXT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TEMP TABLE _phase1_building_map (
    old_id BIGINT PRIMARY KEY,
    new_property_id BIGINT NOT NULL,
    new_building_id BIGINT NOT NULL
  );

  CREATE TEMP TABLE _phase1_property_map (
    old_id BIGINT PRIMARY KEY,
    new_property_id BIGINT NOT NULL
  );

  FOR r IN SELECT * FROM buildings_legacy ORDER BY id LOOP
    INSERT INTO properties (
      name_en, district, country, city, full_address_en,
      latitude, longitude, remarks, status, created_at, updated_at
    ) VALUES (
      r.name,
      COALESCE(r.city, ''),
      COALESCE(r.country, 'Hong Kong'),
      COALESCE(r.city, 'Hong Kong'),
      COALESCE(r.address, ''),
      r.latitude,
      r.longitude,
      r.notes,
      'active',
      r.created_at,
      r.updated_at
    ) RETURNING id INTO v_property_id;

    INSERT INTO buildings (property_id, remarks, created_at, updated_at)
    VALUES (v_property_id, 'Migrated default building', r.created_at, r.updated_at)
    RETURNING id INTO v_building_id;

    INSERT INTO _phase1_building_map (old_id, new_property_id, new_building_id)
    VALUES (r.id, v_property_id, v_building_id);
  END LOOP;

  FOR r IN SELECT * FROM properties_legacy ORDER BY id LOOP
    IF r.building_id IS NOT NULL THEN
      SELECT bm.new_property_id INTO v_property_id
      FROM _phase1_building_map bm
      WHERE bm.old_id = r.building_id;

      IF v_property_id IS NOT NULL THEN
        UPDATE properties
        SET
          name_en = CASE WHEN r.title <> '' THEN r.title ELSE name_en END,
          remarks = COALESCE(r.notes, remarks),
          status = CASE r.status
            WHEN 'active' THEN 'active'
            WHEN 'archived' THEN 'archived'
            ELSE 'inactive'
          END,
          updated_at = GREATEST(properties.updated_at, r.updated_at)
        WHERE id = v_property_id;

        INSERT INTO _phase1_property_map (old_id, new_property_id)
        VALUES (r.id, v_property_id)
        ON CONFLICT (old_id) DO NOTHING;
      END IF;
    ELSE
      INSERT INTO properties (
        name_en, property_type, status, country, city, district,
        full_address_en, remarks, created_at, updated_at
      ) VALUES (
        r.title,
        'Commercial Building',
        CASE r.status
          WHEN 'active' THEN 'active'
          WHEN 'archived' THEN 'archived'
          ELSE 'inactive'
        END,
        'Hong Kong',
        'Hong Kong',
        '',
        '',
        r.notes,
        r.created_at,
        r.updated_at
      ) RETURNING id INTO v_property_id;

      INSERT INTO _phase1_property_map (old_id, new_property_id)
      VALUES (r.id, v_property_id);
    END IF;
  END LOOP;

  INSERT INTO inventory (
    property_id, building_id, operator_id, offer_type, status,
    office_name, office_type, capacity_pax, gross_area_sqft, remarks,
    created_at, updated_at
  )
  SELECT
    pm.new_property_id,
    bm.new_building_id,
    pl.operator_id,
    CASE
      WHEN il.unit_type IN ('Unit', 'Floor', 'Enbloc', 'Serviced Office', 'Shared Office') THEN il.unit_type
      WHEN il.unit_type ILIKE '%serviced%' THEN 'Serviced Office'
      WHEN il.unit_type ILIKE '%shared%' THEN 'Shared Office'
      ELSE 'Unit'
    END,
    CASE il.status
      WHEN 'held' THEN 'proposed'
      WHEN 'leased' THEN 'leased'
      WHEN 'withdrawn' THEN 'withdrawn'
      ELSE 'available'
    END,
    il.label,
    CASE
      WHEN il.unit_type IN ('Unit', 'Floor', 'Enbloc', 'Serviced Office', 'Shared Office') THEN NULL
      ELSE il.unit_type
    END,
    il.quantity,
    il.size_sqft,
    il.notes,
    il.created_at,
    il.updated_at
  FROM inventory_legacy il
  JOIN properties_legacy pl ON pl.id = il.property_id
  JOIN _phase1_property_map pm ON pm.old_id = pl.id
  LEFT JOIN _phase1_building_map bm ON bm.old_id = pl.building_id;

  DROP TABLE inventory_legacy;
  DROP TABLE properties_legacy;
  DROP TABLE buildings_legacy;

  RAISE NOTICE 'Phase 1 migration completed.';
END $$;

COMMIT;
