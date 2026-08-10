ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS management_fee_psf NUMERIC(14, 2) NULL;

