-- Centre operator status for premises (Active / Full / Moved).
ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS centre_status TEXT NULL;

UPDATE premises_v1
SET centre_status = 'Active'
WHERE centre_status IS NULL;
