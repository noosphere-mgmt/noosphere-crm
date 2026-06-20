-- Phase 29: Properties module schema alignment (idempotent).
-- Reconciles production hotfixes so deploys never require manual SQL.
--
-- Buildings page (/admin/properties/buildings) queries properties_v1 via
-- lib/repos/propertiesV1.ts listPropertiesV1 / getPropertyV1 / countPropertiesV1.
-- Every column in that SELECT must exist on properties_v1 before the page loads.
--
-- Premises page joins properties_v1 for district/building name and queries premises_v1
-- commercial columns via lib/repos/premisesV1.ts.

-- ── grade (production hotfix on all three property tables) ───────────────────
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS grade TEXT;

-- ── properties_v1: building header columns (phases 10b, 10c, 27, app) ───────
-- Used by: listPropertiesV1 SELECT in lib/repos/propertiesV1.ts
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS management_company_id TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS operator_company_id TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS current_tenant_company_id TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS owner_company_id TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'HKD';
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS external_ref TEXT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS import_run_id BIGINT;
ALTER TABLE properties_v1 ADD COLUMN IF NOT EXISTS last_verified_date DATE;

CREATE INDEX IF NOT EXISTS idx_properties_v1_management_company
  ON properties_v1(management_company_id);
CREATE INDEX IF NOT EXISTS idx_properties_v1_operator_company
  ON properties_v1(operator_company_id);
CREATE INDEX IF NOT EXISTS idx_properties_v1_current_tenant_company
  ON properties_v1(current_tenant_company_id);
CREATE INDEX IF NOT EXISTS idx_properties_v1_owner_company
  ON properties_v1(owner_company_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_v1_external_ref
  ON properties_v1(external_ref) WHERE external_ref IS NOT NULL;

-- ── premises_v1: inventory / commercial columns (phases 10d–10f, 11, 27) ───
-- Used by: listPremisesFullFiltered, listPremisesForPropertyV1, getPremisesV1
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS operating_model TEXT;
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS relationship_lines JSONB;
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS fit_out_condition TEXT;
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'HKD';
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS asking_sale_price NUMERIC(14, 2);
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS sale_price_psf NUMERIC(14, 2);
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS negotiable_sale_price NUMERIC(14, 2);
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS negotiable_sale_price_psf NUMERIC(14, 2);
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS expected_commission TEXT;
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS payout_commission TEXT;
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS commission_remarks TEXT;
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS last_contact_date DATE;
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS external_ref TEXT;
ALTER TABLE premises_v1 ADD COLUMN IF NOT EXISTS import_run_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_premises_v1_external_ref
  ON premises_v1(external_ref) WHERE external_ref IS NOT NULL;

-- Align premises_v1 column types with application (TEXT commission/deposit fields).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'premises_v1'
      AND column_name = 'deposit_months'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE premises_v1
      ALTER COLUMN deposit_months TYPE TEXT USING deposit_months::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'premises_v1'
      AND column_name = 'commission_rate'
      AND data_type IN ('numeric', 'integer', 'double precision')
  ) THEN
    ALTER TABLE premises_v1
      ALTER COLUMN commission_rate TYPE TEXT USING commission_rate::text;
  END IF;
END $$;

-- ── legacy properties (marketableProperties / quick add) ─────────────────────
-- Used by: lib/repos/marketableProperties.ts
ALTER TABLE properties ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'HKD';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS view_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fitout_condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS window_type TEXT;
