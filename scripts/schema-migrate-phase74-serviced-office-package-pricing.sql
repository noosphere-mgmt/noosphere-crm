-- Serviced / shared office package attributes and per-pax pricing by product tier.
ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS offers_unique_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS offers_stamp_duty TEXT NULL,
  ADD COLUMN IF NOT EXISTS price_pax_mth_unique_address NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_pax_yr_unique_address NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_pax_mth_workstation NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_pax_yr_workstation NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_pax_mth_room_window NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_pax_yr_room_window NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_pax_mth_room_internal NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS price_pax_yr_room_internal NUMERIC(14, 2) NULL;
