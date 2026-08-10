-- Phase 70: keep the Premises source default and existing blank records consistent.
ALTER TABLE premises_v1
  ALTER COLUMN source_type SET DEFAULT 'direct';

UPDATE premises_v1
SET source_type = 'direct'
WHERE source_type IS NULL OR btrim(source_type) = '';
