-- No historical completion is inferred: existing won deals need delivery review.
BEGIN;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS service_delivery_status text NOT NULL DEFAULT 'not_started';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS service_due_date date;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'opportunities'::regclass AND conname = 'opportunities_service_delivery_status_check') THEN
    ALTER TABLE opportunities ADD CONSTRAINT opportunities_service_delivery_status_check
      CHECK (service_delivery_status IN ('not_started','in_progress','completed'));
  END IF;
END $$;
COMMIT;
