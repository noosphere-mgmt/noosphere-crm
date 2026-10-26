BEGIN;
-- Retain dates and all won delivery values; non-won delivery is not applicable.
UPDATE opportunities SET service_delivery_status = 'not_started'
WHERE status <> 'closed_won' AND service_delivery_status <> 'not_started';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'opportunities'::regclass AND conname = 'opportunities_delivery_won_only') THEN
    ALTER TABLE opportunities ADD CONSTRAINT opportunities_delivery_won_only
      CHECK (status = 'closed_won' OR service_delivery_status = 'not_started');
  END IF;
END $$;
COMMIT;
