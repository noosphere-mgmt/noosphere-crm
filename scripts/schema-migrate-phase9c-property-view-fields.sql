-- Phase 9c: View / fit-out fields on inventory properties (additive only).
BEGIN;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS view_type TEXT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fitout_condition TEXT NULL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS window_type TEXT NULL;

COMMIT;
