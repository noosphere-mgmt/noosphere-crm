-- Phase 84: Opportunity start date.
-- NULL means the opportunity is already active. Existing rows are not updated.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS start_date DATE NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_start_date ON opportunities (start_date);
