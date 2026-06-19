-- Phase 10e: Premises commercial / sales / commission fields (additive).

BEGIN;

ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS currency TEXT NULL DEFAULT 'HKD',
  ADD COLUMN IF NOT EXISTS asking_sale_price NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS sale_price_psf NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS negotiable_sale_price NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS negotiable_sale_price_psf NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS expected_commission TEXT NULL,
  ADD COLUMN IF NOT EXISTS payout_commission TEXT NULL,
  ADD COLUMN IF NOT EXISTS commission_remarks TEXT NULL;

ALTER TABLE premises_v1
  ALTER COLUMN deposit_months TYPE TEXT USING deposit_months::text;

COMMIT;
