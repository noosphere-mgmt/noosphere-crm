-- Serviced / shared office: Offers list + annual rent (replaces per-product pax pricing UI).
ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS package_offers TEXT NULL,
  ADD COLUMN IF NOT EXISTS annual_rent NUMERIC(14, 2) NULL;
