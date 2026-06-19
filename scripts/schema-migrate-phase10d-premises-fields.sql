-- Phase 10d: Premises v1 UI alignment (additive / narrow changes only).

BEGIN;

ALTER TABLE premises_v1
  ADD COLUMN IF NOT EXISTS operating_model TEXT NULL,
  ADD COLUMN IF NOT EXISTS relationship_lines JSONB NULL;

ALTER TABLE premises_v1
  ALTER COLUMN commission_rate TYPE TEXT USING commission_rate::text;

COMMIT;
