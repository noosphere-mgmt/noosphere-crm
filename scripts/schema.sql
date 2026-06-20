-- Noosphere Real Estate — Phase 1 schema (Property → Building → Inventory)
BEGIN;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS operators (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  notes       TEXT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operators_name ON operators(name);
CREATE INDEX IF NOT EXISTS idx_operators_active ON operators(is_active);

DROP TRIGGER IF EXISTS trg_operators_updated_at ON operators;
CREATE TRIGGER trg_operators_updated_at
BEFORE UPDATE ON operators
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS _deprecated_sites (
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
  street_no        TEXT NULL,
  street_name_en   TEXT NULL,
  street_name_zh   TEXT NULL,
  full_address_en  TEXT NOT NULL DEFAULT '',
  full_address_zh  TEXT NULL,
  lot_number       TEXT NULL,
  land_use         TEXT NULL,
  ownership_type   TEXT NULL,
  source_url       TEXT NULL,
  last_verified_date DATE NULL,
  latitude         DOUBLE PRECISION NULL,
  longitude        DOUBLE PRECISION NULL,
  remarks          TEXT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deprecated_sites_district ON _deprecated_sites(district);
CREATE INDEX IF NOT EXISTS idx_deprecated_sites_status ON _deprecated_sites(status);
CREATE INDEX IF NOT EXISTS idx_deprecated_sites_name ON _deprecated_sites(name_en);

DROP TRIGGER IF EXISTS trg_deprecated_sites_updated_at ON _deprecated_sites;
CREATE TRIGGER trg_deprecated_sites_updated_at
BEFORE UPDATE ON _deprecated_sites
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS buildings (
  id                      BIGSERIAL PRIMARY KEY,
  property_id             BIGINT NULL REFERENCES _deprecated_sites(id) ON DELETE SET NULL,
  name_en                 TEXT NOT NULL,
  name_zh                   TEXT NULL,
  property_type           TEXT NOT NULL DEFAULT 'Commercial Building',
  centre_type             TEXT NULL,
  status                  TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'inactive', 'archived')),
  country                 TEXT NOT NULL DEFAULT 'Hong Kong',
  city                    TEXT NOT NULL DEFAULT 'Hong Kong',
  district                TEXT NOT NULL DEFAULT '',
  street_no               TEXT NULL,
  street_name_en          TEXT NULL,
  street_name_zh          TEXT NULL,
  full_address_en         TEXT NOT NULL DEFAULT '',
  full_address_zh         TEXT NULL,
  lot_number              TEXT NULL,
  land_use                TEXT NULL,
  ownership_type          TEXT NULL,
  source_url              TEXT NULL,
  last_verified_date      DATE NULL,
  latitude                DOUBLE PRECISION NULL,
  longitude               DOUBLE PRECISION NULL,
  tower_block             TEXT NULL,
  floor_count             INTEGER NULL,
  typical_floor_area_sqft NUMERIC(12, 2) NULL,
  year_built              INTEGER NULL,
  grade                   TEXT NULL,
  mtr_station             TEXT NULL,
  walking_minutes         INTEGER NULL,
  facilities              TEXT NULL,
  green_certification     TEXT NULL,
  remarks                 TEXT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_property ON buildings(property_id);

DROP TRIGGER IF EXISTS trg_buildings_updated_at ON buildings;
CREATE TRIGGER trg_buildings_updated_at
BEFORE UPDATE ON buildings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS assets (
  id                  BIGSERIAL PRIMARY KEY,
  asset_code          TEXT NULL,
  building_id         BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  property_id         BIGINT NOT NULL REFERENCES _deprecated_sites(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS inventory (
  id              BIGSERIAL PRIMARY KEY,
  asset_id        BIGINT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  property_id     BIGINT NOT NULL REFERENCES _deprecated_sites(id) ON DELETE CASCADE,
  building_id     BIGINT NULL REFERENCES buildings(id) ON DELETE SET NULL,
  operator_id     BIGINT NULL REFERENCES operators(id) ON DELETE SET NULL,
  offer_type      TEXT NOT NULL DEFAULT 'Unit'
                  CHECK (offer_type IN ('Unit', 'Floor', 'Enbloc', 'Serviced Office', 'Shared Office')),
  status          TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'proposed', 'leased', 'withdrawn')),
  monthly_rent    NUMERIC(14, 2) NULL,
  rent_psf        NUMERIC(14, 2) NULL,
  management_fee  NUMERIC(14, 2) NULL,
  government_rates NUMERIC(14, 2) NULL,
  deposit_months  INTEGER NULL,
  rent_free_period TEXT NULL,
  contract_term_months INTEGER NULL,
  available_date  DATE NULL,
  commission_rate NUMERIC(6, 4) NULL,
  source_file     TEXT NULL,
  listing_intent  TEXT NOT NULL DEFAULT 'lease'
                  CHECK (listing_intent IN ('lease', 'sale')),
  sale_price      NUMERIC(14, 2) NULL,
  remarks         TEXT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_property ON inventory(property_id);
CREATE INDEX IF NOT EXISTS idx_inventory_building ON inventory(building_id);
CREATE INDEX IF NOT EXISTS idx_inventory_operator ON inventory(operator_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_offer_type ON inventory(offer_type);

DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory;
CREATE TRIGGER trg_inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS opportunities (
  id                    BIGSERIAL PRIMARY KEY,
  client_name           TEXT NOT NULL,
  lead_type             TEXT NOT NULL DEFAULT 'direct_client',
  company_name          TEXT NULL,
  budget_min            NUMERIC(14, 2) NULL,
  budget_max            NUMERIC(14, 2) NULL,
  required_area_sqft    NUMERIC(12, 2) NULL,
  required_capacity_pax INTEGER NULL,
  district_preference   TEXT NULL,
  workspace_type        TEXT NULL,
  move_in_date          DATE NULL,
  status                TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN (
                          'new', 'qualifying', 'sourcing', 'proposal_preparing',
                          'proposal_sent', 'negotiating', 'closed_won', 'closed_lost'
                        )),
  requirement_summary   TEXT NULL,
  remarks               TEXT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'direct_client';

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_client ON opportunities(client_name);
CREATE INDEX IF NOT EXISTS idx_opportunities_lead_type ON opportunities(lead_type);

DROP TRIGGER IF EXISTS trg_opportunities_updated_at ON opportunities;
CREATE TRIGGER trg_opportunities_updated_at
BEFORE UPDATE ON opportunities
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS companies (
  id                      BIGSERIAL PRIMARY KEY,
  company_name            TEXT NOT NULL,
  company_name_zh         TEXT NULL,
  company_name_cn         TEXT NULL,
  roles                   TEXT[] NOT NULL DEFAULT '{}',
  website                 TEXT NULL,
  phone                   TEXT NULL,
  email                   TEXT NULL,
  industry                TEXT NULL,
  source                  TEXT NULL,
  relationship_owner      TEXT NULL,
  last_contact_date       DATE NULL,
  last_meeting_date       DATE NULL,
  next_follow_up_date     DATE NULL,
  relationship_strength   TEXT NULL
                          CHECK (relationship_strength IS NULL OR relationship_strength IN (
                            'cold', 'warm', 'active', 'strategic'
                          )),
  notes                   TEXT NULL,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_roles ON companies USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_companies_next_follow_up ON companies(next_follow_up_date);

DROP TRIGGER IF EXISTS trg_companies_updated_at ON companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS contacts (
  id                    BIGSERIAL PRIMARY KEY,
  company_id            BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_name          TEXT NOT NULL,
  title                 TEXT NULL,
  email                 TEXT NULL,
  phone                 TEXT NULL,
  whatsapp              TEXT NULL,
  wechat                TEXT NULL,
  preferred_language    TEXT NULL,
  is_primary            BOOLEAN NOT NULL DEFAULT FALSE,
  contact_role          TEXT[] NOT NULL DEFAULT '{}',
  coverage              TEXT[] NOT NULL DEFAULT '{}',
  last_contact_date     DATE NULL,
  next_follow_up_date   DATE NULL,
  notes                 TEXT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS contact_role TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(contact_name);
CREATE INDEX IF NOT EXISTS idx_contacts_primary ON contacts(company_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_contacts_contact_role ON contacts USING GIN (contact_role);
CREATE INDEX IF NOT EXISTS idx_contacts_coverage ON contacts USING GIN (coverage);

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Opportunity CRM FKs (columns added in phase 6 migration for existing DBs)
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS primary_contact_id BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referrer_company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_close_date DATE NULL,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS relationship_owner TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_primary_contact ON opportunities(primary_contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_referrer ON opportunities(referrer_company_id);

-- Import Workbench IW-1 (see schema-migrate-phase7-import-iw1.sql for incremental apply)
CREATE TABLE IF NOT EXISTS import_runs (
  id                BIGSERIAL PRIMARY KEY,
  session_id        TEXT NULL,
  import_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  object_type       TEXT NOT NULL,
  filename          TEXT NOT NULL,
  uploaded_by       TEXT NOT NULL,
  source_system     TEXT NULL,
  source_file       TEXT NULL,
  source_date       DATE NULL,
  created_count     INTEGER NOT NULL DEFAULT 0,
  updated_count     INTEGER NOT NULL DEFAULT 0,
  cleared_count     INTEGER NOT NULL DEFAULT 0,
  skipped_count     INTEGER NOT NULL DEFAULT 0,
  error_count       INTEGER NOT NULL DEFAULT 0,
  duplicate_count   INTEGER NOT NULL DEFAULT 0,
  column_mapping    JSONB NOT NULL DEFAULT '{}',
  summary           JSONB NULL
);

CREATE TABLE IF NOT EXISTS import_sessions (
  id                TEXT PRIMARY KEY,
  object_type       TEXT NOT NULL,
  filename          TEXT NOT NULL,
  uploaded_by       TEXT NOT NULL,
  source_system     TEXT NULL,
  source_file       TEXT NULL,
  source_date       DATE NULL,
  status            TEXT NOT NULL DEFAULT 'mapping',
  csv_headers       JSONB NOT NULL DEFAULT '[]',
  column_mapping    JSONB NOT NULL DEFAULT '{}',
  row_count         INTEGER NOT NULL DEFAULT 0,
  parsed_rows       JSONB NOT NULL DEFAULT '[]',
  preview_summary   JSONB NULL,
  preview_rows      JSONB NULL,
  import_run_id     BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

CREATE TABLE IF NOT EXISTS import_run_rows (
  id                BIGSERIAL PRIMARY KEY,
  import_run_id     BIGINT NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,
  row_number        INTEGER NOT NULL,
  action            TEXT NOT NULL,
  match_method      TEXT NULL,
  matched_id        BIGINT NULL,
  candidate_ids     BIGINT[] NULL,
  error_message     TEXT NULL,
  field_changes     JSONB NULL,
  raw_row           JSONB NULL
);

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_file TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_date DATE NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_file TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_date DATE NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS title TEXT NULL,
  ADD COLUMN IF NOT EXISTS lead_source TEXT NULL,
  ADD COLUMN IF NOT EXISTS external_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_system TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_file TEXT NULL,
  ADD COLUMN IF NOT EXISTS source_date DATE NULL,
  ADD COLUMN IF NOT EXISTS import_run_id BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL;

-- Properties module v1 tables (workbook-aligned; extended by migrate phases 10b–10f, 27, 29)
CREATE TABLE IF NOT EXISTS id_map_v1 (
  entity_type   TEXT NOT NULL,
  legacy_id     BIGINT NOT NULL,
  new_id        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_type, legacy_id),
  UNIQUE (entity_type, new_id)
);

CREATE TABLE IF NOT EXISTS companies_v1 (
  company_id          TEXT PRIMARY KEY,
  company_match_id    TEXT NULL,
  company_name_en     TEXT NULL,
  company_name_zh     TEXT NULL,
  company_type        TEXT NULL,
  industry            TEXT NULL,
  website             TEXT NULL,
  main_phone          TEXT NULL,
  email_domain        TEXT NULL,
  billing_address     TEXT NULL,
  source              TEXT NULL,
  company_status      TEXT NULL,
  company_remarks     TEXT NULL,
  company_source      TEXT NULL,
  company_label       TEXT NULL,
  legacy_company_id   BIGINT NULL UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties_v1 (
  property_id            TEXT PRIMARY KEY,
  building_match_id      TEXT NULL,
  bldg_name_en           TEXT NULL,
  bldg_name_zh           TEXT NULL,
  bldg_name_cn           TEXT NULL,
  tower_block            TEXT NULL,
  floor_count            INTEGER NULL,
  bldg_area_sqft         NUMERIC(14, 2) NULL,
  bldg_area_sqm          NUMERIC(14, 2) NULL,
  year_built             INTEGER NULL,
  bldg_desc              TEXT NULL,
  building_remarks       TEXT NULL,
  land_use               TEXT NULL,
  class_of_site          TEXT NULL,
  land_tenure            TEXT NULL,
  plot_ratio             NUMERIC(12, 4) NULL,
  site_area_sqft         NUMERIC(14, 2) NULL,
  site_area_sqm          NUMERIC(14, 2) NULL,
  country                TEXT NULL,
  city_en                TEXT NULL,
  city_zh                TEXT NULL,
  city_cn                TEXT NULL,
  district_en            TEXT NULL,
  district_zh            TEXT NULL,
  district_cn            TEXT NULL,
  street_no              TEXT NULL,
  street_name_en         TEXT NULL,
  street_name_zh         TEXT NULL,
  street_name_cn         TEXT NULL,
  full_address_en        TEXT NULL,
  full_address_zh        TEXT NULL,
  full_address_cn        TEXT NULL,
  mtr_station            TEXT NULL,
  walking_minutes        INTEGER NULL,
  facilities             TEXT NULL,
  green_certification    TEXT NULL,
  lot_number             TEXT NULL,
  grade                  TEXT NULL,
  currency               TEXT NULL DEFAULT 'HKD',
  management_company_id  TEXT NULL REFERENCES companies_v1(company_id) ON DELETE SET NULL,
  title                  TEXT NULL,
  operator_company_id    TEXT NULL REFERENCES companies_v1(company_id) ON DELETE SET NULL,
  current_tenant_company_id TEXT NULL REFERENCES companies_v1(company_id) ON DELETE SET NULL,
  owner_company_id       TEXT NULL REFERENCES companies_v1(company_id) ON DELETE SET NULL,
  inventory_count        INTEGER NULL,
  inventory_count_sales  INTEGER NULL,
  inventory_count_lease  INTEGER NULL,
  external_ref           TEXT NULL,
  import_run_id          BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  last_verified_date     DATE NULL,
  legacy_building_id     BIGINT NULL UNIQUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS premises_v1 (
  premises_id            TEXT PRIMARY KEY,
  property_id            TEXT NOT NULL REFERENCES properties_v1(property_id) ON DELETE CASCADE,
  property_name_en       TEXT NULL,
  property_name_zh       TEXT NULL,
  property_type          TEXT NULL,
  centre_type            TEXT NULL,
  inventory_status       TEXT NULL,
  ownership_type         TEXT NULL,
  floor                  TEXT NULL,
  unit                   TEXT NULL,
  workstation_count      TEXT NULL,
  office_name            TEXT NULL,
  office_type            TEXT NULL,
  gross_area_sqft        NUMERIC(14, 2) NULL,
  net_area_sqft          NUMERIC(14, 2) NULL,
  view_type              TEXT NULL,
  windows                TEXT NULL,
  management_fee         NUMERIC(14, 2) NULL,
  government_rates       NUMERIC(14, 2) NULL,
  remarks                TEXT NULL,
  owner_company_id           TEXT NULL,
  landlord_company_id        TEXT NULL,
  current_tenant_company_id  TEXT NULL,
  operator_company_id        TEXT NULL,
  source_company_id          TEXT NULL,
  source_contact_id          TEXT NULL,
  source_contact_role        TEXT NULL,
  offer_type             TEXT NULL,
  offer_status           TEXT NULL,
  capacity_pax           INTEGER NULL,
  monthly_rent           NUMERIC(14, 2) NULL,
  rent_psf               NUMERIC(14, 2) NULL,
  deposit_months         TEXT NULL,
  rent_free_period       TEXT NULL,
  contract_term_months   INTEGER NULL,
  available_date         DATE NULL,
  commission_rate        TEXT NULL,
  currency               TEXT NULL DEFAULT 'HKD',
  asking_sale_price      NUMERIC(14, 2) NULL,
  sale_price_psf         NUMERIC(14, 2) NULL,
  negotiable_sale_price  NUMERIC(14, 2) NULL,
  negotiable_sale_price_psf NUMERIC(14, 2) NULL,
  expected_commission    TEXT NULL,
  payout_commission      TEXT NULL,
  commission_remarks     TEXT NULL,
  operating_model        TEXT NULL,
  fit_out_condition      TEXT NULL,
  relationship_lines     JSONB NULL,
  source_file            TEXT NULL,
  source_url             TEXT NULL,
  last_verified_date     DATE NULL,
  last_contact_date      DATE NULL,
  listing_remarks        TEXT NULL,
  external_ref           TEXT NULL,
  import_run_id          BIGINT NULL REFERENCES import_runs(id) ON DELETE SET NULL,
  legacy_property_row_id BIGINT NULL UNIQUE,
  legacy_asset_id        BIGINT NULL,
  legacy_inventory_id    BIGINT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_v1_district_en ON properties_v1(district_en);
CREATE INDEX IF NOT EXISTS idx_premises_v1_property ON premises_v1(property_id);
CREATE INDEX IF NOT EXISTS idx_premises_v1_location ON premises_v1(property_id, floor, unit);

COMMIT;
