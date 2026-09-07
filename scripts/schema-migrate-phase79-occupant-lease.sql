-- Occupant tenancy on premises (denormalized from Current Occupant relationship line).
ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS occupant_lease_commencement DATE NULL,
  ADD COLUMN IF NOT EXISTS occupant_lease_expiry DATE NULL,
  ADD COLUMN IF NOT EXISTS occupant_lease_term TEXT NULL;
