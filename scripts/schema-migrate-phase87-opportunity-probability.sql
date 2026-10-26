BEGIN;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS probability integer;
-- Preserve every existing non-null probability, including zero.
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
UPDATE opportunities SET probability = CASE
  WHEN status IN ('closed_won') THEN 100
  WHEN status IN ('closed_lost') THEN 0
  WHEN status IN ('negotiating', 'pending_approval', 'contracting', 'awaiting_approval') THEN 70
  WHEN status IN ('proposal_reviewing', 'proposal_review', 'client_reviewing_options', 'proposal_preparing', 'proposal_sent', 'awaiting_client_feedback', 'refining_requirement', 'awaiting_client_decision') THEN 50
  WHEN status IN ('sourcing', 'active_sourcing') THEN 25
  ELSE 10 END WHERE probability IS NULL;
  IF timestamp_trigger_enabled THEN
    ALTER TABLE opportunities ENABLE TRIGGER trg_opportunities_updated_at;
  END IF;
END $preserve_updated_at$;
ALTER TABLE opportunities ALTER COLUMN probability SET DEFAULT 10;
ALTER TABLE opportunities ALTER COLUMN probability SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'opportunities'::regclass AND conname = 'opportunities_probability_range') THEN
    ALTER TABLE opportunities ADD CONSTRAINT opportunities_probability_range CHECK (probability BETWEEN 0 AND 100);
  END IF;
END $$;
COMMIT;
