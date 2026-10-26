BEGIN;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS probability integer;
-- Preserve every existing non-null probability, including zero.
UPDATE opportunities SET probability = CASE
  WHEN status IN ('closed_won') THEN 100
  WHEN status IN ('closed_lost') THEN 0
  WHEN status IN ('negotiating', 'pending_approval', 'contracting', 'awaiting_approval') THEN 70
  WHEN status IN ('proposal_reviewing', 'proposal_review', 'client_reviewing_options', 'proposal_preparing', 'proposal_sent', 'awaiting_client_feedback', 'refining_requirement', 'awaiting_client_decision') THEN 50
  WHEN status IN ('sourcing', 'active_sourcing') THEN 25
  ELSE 10 END WHERE probability IS NULL;
ALTER TABLE opportunities ALTER COLUMN probability SET DEFAULT 10;
ALTER TABLE opportunities ALTER COLUMN probability SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'opportunities'::regclass AND conname = 'opportunities_probability_range') THEN
    ALTER TABLE opportunities ADD CONSTRAINT opportunities_probability_range CHECK (probability BETWEEN 0 AND 100);
  END IF;
END $$;
COMMIT;
