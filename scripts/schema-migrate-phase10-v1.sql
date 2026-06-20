-- Phase 10 (v1): Create workbook-aligned v1 tables (additive only).
-- Authoritative schema: NML_DataSchema_Revise.xlsx (corrected anomalies).
-- Notes:
-- - Legacy tables remain intact.
-- - Lookup-typed fields stored as TEXT (no CHECK constraints yet).

BEGIN;

CREATE TABLE IF NOT EXISTS id_map_v1 (
  entity_type   TEXT NOT NULL,
  legacy_id     BIGINT NOT NULL,
  new_id        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_type, legacy_id),
  UNIQUE (entity_type, new_id)
);

-- Properties module: Property header (Building + Site)
CREATE TABLE IF NOT EXISTS properties_v1 (
  property_id            TEXT PRIMARY KEY, -- workbook building_id: BLDG-YYYY-####
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
  management_company_id  TEXT NULL,
  title                  TEXT NULL,
  operator_company_id    TEXT NULL,
  current_tenant_company_id TEXT NULL,
  owner_company_id       TEXT NULL,
  currency               TEXT NULL DEFAULT 'HKD',

  inventory_count        INTEGER NULL,
  inventory_count_sales  INTEGER NULL,
  inventory_count_lease  INTEGER NULL,

  external_ref           TEXT NULL,
  import_run_id          BIGINT NULL,
  last_verified_date     DATE NULL,

  legacy_building_id     BIGINT NULL UNIQUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_v1_district_en ON properties_v1(district_en);

DROP TRIGGER IF EXISTS trg_properties_v1_updated_at ON properties_v1;
CREATE TRIGGER trg_properties_v1_updated_at
BEFORE UPDATE ON properties_v1
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Properties module: Premises line items (includes listing terms per v1 decision)
CREATE TABLE IF NOT EXISTS premises_v1 (
  premises_id            TEXT PRIMARY KEY, -- workbook inventory_id: INV-YYYY-####
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

  -- Company links (v1 direct columns)
  owner_company_id           TEXT NULL,
  landlord_company_id        TEXT NULL,
  current_tenant_company_id  TEXT NULL,
  operator_company_id        TEXT NULL,
  source_company_id          TEXT NULL,
  source_contact_id          TEXT NULL,
  source_contact_role        TEXT NULL,

  -- Commercial Terms / Listing Terms (Property::4_Offer)
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
  import_run_id          BIGINT NULL,

  legacy_property_row_id BIGINT NULL UNIQUE,
  legacy_asset_id        BIGINT NULL,
  legacy_inventory_id    BIGINT NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_premises_v1_property ON premises_v1(property_id);
CREATE INDEX IF NOT EXISTS idx_premises_v1_location ON premises_v1(property_id, floor, unit);

DROP TRIGGER IF EXISTS trg_premises_v1_updated_at ON premises_v1;
CREATE TRIGGER trg_premises_v1_updated_at
BEFORE UPDATE ON premises_v1
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Connections module
CREATE TABLE IF NOT EXISTS companies_v1 (
  company_id          TEXT PRIMARY KEY, -- COMP-YYYY-####
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

CREATE INDEX IF NOT EXISTS idx_companies_v1_name ON companies_v1(company_name_en);

DROP TRIGGER IF EXISTS trg_companies_v1_updated_at ON companies_v1;
CREATE TRIGGER trg_companies_v1_updated_at
BEFORE UPDATE ON companies_v1
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS contacts_v1 (
  contact_id         TEXT PRIMARY KEY, -- CONT-YYYY-####
  company_id         TEXT NULL REFERENCES companies_v1(company_id) ON DELETE SET NULL,
  first_name         TEXT NULL,
  last_name          TEXT NULL,
  display_name       TEXT NULL,
  name_zh            TEXT NULL,
  title              TEXT NULL,
  mobile             TEXT NULL,
  email              TEXT NULL,
  whatsapp           TEXT NULL,
  wechat             TEXT NULL,
  preferred_language TEXT NULL,
  contact_status     TEXT NULL,
  remarks            TEXT NULL,
  contact_source     TEXT NULL,
  legacy_contact_id  BIGINT NULL UNIQUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_v1_company ON contacts_v1(company_id);

DROP TRIGGER IF EXISTS trg_contacts_v1_updated_at ON contacts_v1;
CREATE TRIGGER trg_contacts_v1_updated_at
BEFORE UPDATE ON contacts_v1
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS company_channel_lines_v1 (
  id            BIGSERIAL PRIMARY KEY,
  company_id    TEXT NOT NULL REFERENCES companies_v1(company_id) ON DELETE CASCADE,
  channel_type  TEXT NOT NULL,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  remarks       TEXT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_channel_lines_v1_company ON company_channel_lines_v1(company_id);

DROP TRIGGER IF EXISTS trg_company_channel_lines_v1_updated_at ON company_channel_lines_v1;
CREATE TRIGGER trg_company_channel_lines_v1_updated_at
BEFORE UPDATE ON company_channel_lines_v1
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Opportunities module
CREATE TABLE IF NOT EXISTS opportunities_v1 (
  opportunity_id        TEXT PRIMARY KEY, -- OPP-YYYY-####
  opportunity_type      TEXT NULL,
  pipeline_status       TEXT NULL,
  priority              TEXT NULL,
  client_company_id     TEXT NULL,
  client_contact_id     TEXT NULL,
  source_company_id     TEXT NULL,
  source_contact_id     TEXT NULL,
  requirement_summary   TEXT NULL,
  target_districts      TEXT NULL,
  target_capacity_pax   INTEGER NULL,
  target_area_sqft      NUMERIC(14, 2) NULL,
  budget_min            NUMERIC(14, 2) NULL,
  budget_max            NUMERIC(14, 2) NULL,
  move_in_date          DATE NULL,
  lease_term_months     INTEGER NULL,
  created_date          DATE NULL,
  next_follow_up_date   DATE NULL,
  decision_date         DATE NULL,
  lost_reason           TEXT NULL,
  remarks               TEXT NULL,
  legacy_opportunity_id BIGINT NULL UNIQUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_v1_pipeline ON opportunities_v1(pipeline_status);

DROP TRIGGER IF EXISTS trg_opportunities_v1_updated_at ON opportunities_v1;
CREATE TRIGGER trg_opportunities_v1_updated_at
BEFORE UPDATE ON opportunities_v1
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS proposals_v1 (
  proposal_id              TEXT PRIMARY KEY,
  opportunity_id           TEXT NOT NULL REFERENCES opportunities_v1(opportunity_id) ON DELETE CASCADE,
  proposal_title           TEXT NULL,
  proposal_date            DATE NULL,
  prepared_for_company_id  TEXT NULL,
  prepared_for_contact_id  TEXT NULL,
  prepared_by              TEXT NULL,
  language                 TEXT NULL,
  version                  TEXT NULL,
  proposal_status          TEXT NULL,
  template_name            TEXT NULL,
  executive_summary        TEXT NULL,
  consultancy_advice       TEXT NULL,
  output_file              TEXT NULL,
  sent_date                DATE NULL,
  remarks                  TEXT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_v1_opportunity ON proposals_v1(opportunity_id);

DROP TRIGGER IF EXISTS trg_proposals_v1_updated_at ON proposals_v1;
CREATE TRIGGER trg_proposals_v1_updated_at
BEFORE UPDATE ON proposals_v1
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS proposal_items_v1 (
  proposal_item_id     TEXT PRIMARY KEY,
  proposal_id          TEXT NOT NULL REFERENCES proposals_v1(proposal_id) ON DELETE CASCADE,
  premises_id          TEXT NOT NULL REFERENCES premises_v1(premises_id) ON DELETE RESTRICT,
  rank                 INTEGER NULL,
  shortlisted           BOOLEAN NULL,
  recommended          BOOLEAN NULL,
  recommendation_label TEXT NULL,
  display_rent         TEXT NULL,
  net_effective_rent   NUMERIC(14, 2) NULL,
  total_initial_cost   NUMERIC(14, 2) NULL,
  pros                 TEXT NULL,
  cons                 TEXT NULL,
  advisor_comment      TEXT NULL,
  operator_source_file TEXT NULL,
  source_import_id     TEXT NULL,
  referral             TEXT[] NULL,
  commission_split     TEXT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_items_v1_proposal ON proposal_items_v1(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_items_v1_premises ON proposal_items_v1(premises_id);

DROP TRIGGER IF EXISTS trg_proposal_items_v1_updated_at ON proposal_items_v1;
CREATE TRIGGER trg_proposal_items_v1_updated_at
BEFORE UPDATE ON proposal_items_v1
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

