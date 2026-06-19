-- Phase 3: Asset layer — create assets, backfill from inventory, drop physical columns
BEGIN;

CREATE TABLE IF NOT EXISTS assets (
  id                  BIGSERIAL PRIMARY KEY,
  asset_code          TEXT NULL,
  building_id         BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  property_id         BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  parent_asset_id     BIGINT NULL REFERENCES assets(id) ON DELETE SET NULL,
  asset_type          TEXT NOT NULL
                      CHECK (asset_type IN ('Floor', 'Unit', 'Suite', 'Room', 'Enbloc')),
  asset_status        TEXT NOT NULL DEFAULT 'active'
                      CHECK (asset_status IN ('active', 'inactive', 'archived')),
  floor               TEXT NULL,
  unit                TEXT NULL,
  suite               TEXT NULL,
  display_name_en     TEXT NOT NULL,
  display_name_zh     TEXT NULL,
  office_name         TEXT NULL,
  gross_area_sqft     NUMERIC(12, 2) NULL,
  net_area_sqft       NUMERIC(12, 2) NULL,
  capacity_pax        INTEGER NULL,
  view_type           TEXT NULL,
  windows             TEXT NULL
                      CHECK (windows IS NULL OR windows IN ('Yes', 'No', 'Partial')),
  office_type         TEXT NULL,
  source_url          TEXT NULL,
  last_verified_date  DATE NULL,
  remarks             TEXT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_building ON assets(building_id);
CREATE INDEX IF NOT EXISTS idx_assets_property ON assets(property_id);
CREATE INDEX IF NOT EXISTS idx_assets_parent ON assets(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(asset_status);

DROP TRIGGER IF EXISTS trg_assets_updated_at ON assets;
CREATE TRIGGER trg_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS asset_id BIGINT NULL REFERENCES assets(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_inventory_asset ON inventory(asset_id);

DO $$
DECLARE
  r RECORD;
  v_building_id BIGINT;
  v_property_id BIGINT;
  v_asset_id BIGINT;
  v_asset_type TEXT;
  v_display_name TEXT;
  v_dedupe_key TEXT;
  v_map JSONB := '{}'::JSONB;
  v_has_physical BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'floor'
  ) INTO v_has_physical;

  IF NOT v_has_physical THEN
    RAISE NOTICE 'Phase 3: inventory physical columns already removed, skipping backfill.';
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM inventory WHERE asset_id IS NULL) THEN
    RAISE NOTICE 'Phase 3: backfilling assets from inventory…';
  ELSE
    RAISE NOTICE 'Phase 3: all inventory rows already linked to assets.';
    RETURN;
  END IF;

  FOR r IN
    SELECT i.*
    FROM inventory i
    WHERE i.asset_id IS NULL
    ORDER BY i.updated_at DESC, i.id ASC
  LOOP
    v_property_id := r.property_id;
    v_building_id := r.building_id;

    IF v_building_id IS NULL THEN
      SELECT b.id INTO v_building_id
      FROM buildings b
      WHERE b.property_id = v_property_id
      ORDER BY b.id ASC
      LIMIT 1;

      IF v_building_id IS NULL THEN
        INSERT INTO buildings (property_id, tower_block, remarks)
        VALUES (v_property_id, NULL, 'Default building (migrated)')
        RETURNING id INTO v_building_id;
      END IF;
    END IF;

    v_asset_type := CASE r.offer_type
      WHEN 'Floor' THEN 'Floor'
      WHEN 'Unit' THEN 'Unit'
      WHEN 'Enbloc' THEN 'Enbloc'
      WHEN 'Serviced Office' THEN 'Room'
      WHEN 'Shared Office' THEN 'Room'
      ELSE 'Unit'
    END;

    v_dedupe_key := v_building_id::TEXT || '|'
      || v_asset_type || '|'
      || COALESCE(lower(trim(r.floor)), '') || '|'
      || COALESCE(lower(trim(r.unit)), '') || '|'
      || COALESCE(lower(trim(r.office_name)), '');

    IF v_map ? v_dedupe_key THEN
      v_asset_id := (v_map ->> v_dedupe_key)::BIGINT;
    ELSE
      v_display_name := COALESCE(
        NULLIF(trim(r.office_name), ''),
        NULLIF(trim(concat_ws(' · ', NULLIF(trim(r.floor), ''), NULLIF(trim(r.unit), ''))), ''),
        v_asset_type || ' #' || r.id::TEXT
      );

      INSERT INTO assets (
        building_id, property_id, asset_type, asset_status,
        floor, unit, display_name_en, office_name,
        gross_area_sqft, net_area_sqft, capacity_pax,
        view_type, windows, office_type, remarks,
        created_at, updated_at
      ) VALUES (
        v_building_id, v_property_id, v_asset_type, 'active',
        NULLIF(trim(r.floor), ''), NULLIF(trim(r.unit), ''), v_display_name,
        NULLIF(trim(r.office_name), ''),
        r.gross_area_sqft, r.net_area_sqft, r.capacity_pax,
        r.view_type, r.windows, r.office_type, r.remarks,
        r.created_at, r.updated_at
      )
      RETURNING id INTO v_asset_id;

      v_map := v_map || jsonb_build_object(v_dedupe_key, v_asset_id);
    END IF;

    UPDATE inventory
    SET asset_id = v_asset_id,
        building_id = v_building_id,
        property_id = v_property_id
    WHERE id = r.id;
  END LOOP;

  RAISE NOTICE 'Phase 3: asset backfill completed.';
END $$;

ALTER TABLE inventory DROP COLUMN IF EXISTS floor;
ALTER TABLE inventory DROP COLUMN IF EXISTS unit;
ALTER TABLE inventory DROP COLUMN IF EXISTS office_name;
ALTER TABLE inventory DROP COLUMN IF EXISTS office_type;
ALTER TABLE inventory DROP COLUMN IF EXISTS capacity_pax;
ALTER TABLE inventory DROP COLUMN IF EXISTS gross_area_sqft;
ALTER TABLE inventory DROP COLUMN IF EXISTS net_area_sqft;
ALTER TABLE inventory DROP COLUMN IF EXISTS view_type;
ALTER TABLE inventory DROP COLUMN IF EXISTS windows;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM inventory WHERE asset_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Phase 3 failed: inventory rows without asset_id remain.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory'
      AND column_name = 'asset_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE inventory ALTER COLUMN asset_id SET NOT NULL;
  END IF;
END $$;

COMMIT;
