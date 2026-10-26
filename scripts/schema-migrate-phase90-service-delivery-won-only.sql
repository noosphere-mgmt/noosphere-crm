BEGIN;
-- Retain dates and all won delivery values; non-won delivery is not applicable.
-- Backfill housekeeping must not count as a user edit.
DO $preserve_updated_at$
DECLARE timestamp_trigger_enabled boolean;
BEGIN
  SELECT tgenabled = 'O' INTO timestamp_trigger_enabled
    FROM pg_trigger WHERE tgrelid = 'opportunities'::regclass
      AND tgname = 'trg_opportunities_updated_at';
  IF timestamp_trigger_enabled THEN
    ALTER TABLE opportunities DISABLE TRIGGER trg_opportunities_updated_at;
  END IF;
UPDATE opportunities SET service_delivery_status = 'not_started'
WHERE status <> 'closed_won' AND service_delivery_status <> 'not_started';
  IF timestamp_trigger_enabled THEN
    ALTER TABLE opportunities ENABLE TRIGGER trg_opportunities_updated_at;
  END IF;
END $preserve_updated_at$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'opportunities'::regclass AND conname = 'opportunities_delivery_won_only') THEN
    ALTER TABLE opportunities ADD CONSTRAINT opportunities_delivery_won_only
      CHECK (status = 'closed_won' OR service_delivery_status = 'not_started');
  END IF;
END $$;
COMMIT;
