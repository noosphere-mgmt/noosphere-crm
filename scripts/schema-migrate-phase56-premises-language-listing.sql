ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS property_name_cn TEXT NULL;

ALTER TABLE premises_v1
  ALTER COLUMN market_mode SET DEFAULT 'lease',
  ALTER COLUMN availability_status SET DEFAULT 'available';

