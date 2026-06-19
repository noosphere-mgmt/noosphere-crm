-- Phase 9a: Rename legacy site `properties` → `_deprecated_sites`; create inventory `properties`.
BEGIN;

-- If schema.sql created an empty _deprecated_sites before legacy rename, remove it.
DO $$
DECLARE
  legacy_properties_exists BOOLEAN;
  deprecated_exists BOOLEAN;
  deprecated_rows BIGINT;
  deprecated_fk_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'properties'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'name_en'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'building_id'
  ) INTO legacy_properties_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = '_deprecated_sites'
  ) INTO deprecated_exists;

  IF legacy_properties_exists AND deprecated_exists THEN
    SELECT COUNT(*)::bigint FROM _deprecated_sites INTO deprecated_rows;
    SELECT COUNT(*)::integer
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = '_deprecated_sites'
    INTO deprecated_fk_count;

    IF deprecated_rows = 0 AND deprecated_fk_count = 0 THEN
      DROP TABLE _deprecated_sites;
      deprecated_exists := FALSE;
    END IF;
  END IF;

  IF legacy_properties_exists AND NOT deprecated_exists THEN
    ALTER TABLE properties RENAME TO _deprecated_sites;
    ALTER INDEX IF EXISTS idx_properties_district RENAME TO idx_deprecated_sites_district;
    ALTER INDEX IF EXISTS idx_properties_status RENAME TO idx_deprecated_sites_status;
    ALTER INDEX IF EXISTS idx_properties_name RENAME TO idx_deprecated_sites_name;
    ALTER TRIGGER trg_properties_updated_at ON _deprecated_sites RENAME TO trg_deprecated_sites_updated_at;
  END IF;
END $$;

-- Inventory properties (marketable spaces) — empty until Phase 9b ETL.
CREATE TABLE IF NOT EXISTS properties (
  id                          BIGSERIAL PRIMARY KEY,
  building_id                 BIGINT NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
  floor                       TEXT NULL,
  unit                        TEXT NULL,
  property_category           TEXT NOT NULL,
  operating_model             TEXT NOT NULL,
  listing_intent              TEXT NOT NULL DEFAULT 'lease'
                              CHECK (listing_intent IN ('lease', 'sale', 'both')),
  space_form                  TEXT NOT NULL,
  occupancy_status            TEXT NULL,
  area_sqft                   NUMERIC(12, 2) NULL,
  capacity_pax                INTEGER NULL,
  operator_company_id         BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  landlord_company_id         BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  current_tenant_company_id   BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  furniture                   TEXT NULL,
  office_equipment            TEXT NULL,
  meeting_room                TEXT NULL,
  reception_service           TEXT NULL,
  it_network                  TEXT NULL,
  move_in_status              TEXT NULL,
  asking_rent                 NUMERIC(14, 2) NULL,
  asking_sale_price           NUMERIC(14, 2) NULL,
  rent_psf                    NUMERIC(14, 2) NULL,
  management_fee              NUMERIC(14, 2) NULL,
  deposit_months              INTEGER NULL,
  rent_free_period            TEXT NULL,
  contract_term_months        INTEGER NULL,
  commission_rate             NUMERIC(6, 4) NULL,
  available_date              DATE NULL,
  specification               TEXT NULL,
  status                      TEXT NOT NULL DEFAULT 'available'
                              CHECK (status IN (
                                'available', 'proposed', 'leased', 'sold', 'withdrawn', 'archived'
                              )),
  source                      TEXT NULL,
  source_date                 DATE NULL,
  last_updated_date           DATE NULL,
  remarks                     TEXT NULL,
  external_ref                TEXT NULL,
  source_system               TEXT NULL,
  source_file                 TEXT NULL,
  import_run_id               BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  legacy_asset_id             BIGINT NULL,
  legacy_inventory_id         BIGINT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_building ON properties(building_id);
CREATE INDEX IF NOT EXISTS idx_properties_building_floor_unit ON properties(building_id, floor, unit);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(property_category);
CREATE INDEX IF NOT EXISTS idx_properties_operating_model ON properties(operating_model);
CREATE INDEX IF NOT EXISTS idx_properties_listing_intent ON properties(listing_intent);
CREATE INDEX IF NOT EXISTS idx_properties_space_form ON properties(space_form);
CREATE INDEX IF NOT EXISTS idx_properties_occupancy ON properties(occupancy_status);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_operator_company ON properties(operator_company_id);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_company ON properties(landlord_company_id);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_company ON properties(current_tenant_company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_external_ref_unique
  ON properties(external_ref) WHERE external_ref IS NOT NULL;

DROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;
CREATE TRIGGER trg_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
