-- Phase 21: Single budget target, proposed premises tour date

UPDATE opportunities
SET budget_max = budget_min
WHERE budget_max IS NULL AND budget_min IS NOT NULL;

ALTER TABLE opportunity_proposed_premises
  ADD COLUMN IF NOT EXISTS tour_date DATE NULL;

UPDATE opportunity_proposed_premises
SET tour_date = proposed_date
WHERE tour_date IS NULL AND proposed_date IS NOT NULL;
