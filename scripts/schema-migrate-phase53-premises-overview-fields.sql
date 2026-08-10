ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS no_of_rooms TEXT NULL,
  ADD COLUMN IF NOT EXISTS gross_area_sqm NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS net_area_sqm NUMERIC(14, 2) NULL;

UPDATE premises_v1
SET no_of_rooms = workstation_count
WHERE no_of_rooms IS NULL AND workstation_count IS NOT NULL;
