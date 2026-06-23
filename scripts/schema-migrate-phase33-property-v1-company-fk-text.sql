-- Phase 33: Align properties_v1 / premises_v1 company FK columns to TEXT (COMP-* refs).
-- Production may have BIGINT columns from early migrations; ADD COLUMN IF NOT EXISTS TEXT
-- does not change an existing BIGINT column. This migration converts in place when needed.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'properties_v1'
      AND column_name = 'operator_company_id'
      AND data_type = 'bigint'
  ) THEN
    ALTER TABLE properties_v1
      ALTER COLUMN management_company_id TYPE TEXT USING management_company_id::text,
      ALTER COLUMN operator_company_id TYPE TEXT USING operator_company_id::text,
      ALTER COLUMN owner_company_id TYPE TEXT USING owner_company_id::text,
      ALTER COLUMN current_tenant_company_id TYPE TEXT USING current_tenant_company_id::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'premises_v1'
      AND column_name = 'operator_company_id'
      AND data_type = 'bigint'
  ) THEN
    ALTER TABLE premises_v1
      ALTER COLUMN owner_company_id TYPE TEXT USING owner_company_id::text,
      ALTER COLUMN landlord_company_id TYPE TEXT USING landlord_company_id::text,
      ALTER COLUMN current_tenant_company_id TYPE TEXT USING current_tenant_company_id::text,
      ALTER COLUMN operator_company_id TYPE TEXT USING operator_company_id::text,
      ALTER COLUMN source_company_id TYPE TEXT USING source_company_id::text,
      ALTER COLUMN source_contact_id TYPE TEXT USING source_contact_id::text;
  END IF;
END $$;
