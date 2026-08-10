-- Phase 47: simplify the proposed-premises operator workflow.
-- Being added to a deal already means proposed; status records the client journey.

UPDATE opportunity_proposed_premises
SET status = CASE
  WHEN status IN ('proposed', 'presented', 'shortlisted') THEN 'shortlisted'
  WHEN status = 'viewing' THEN 'viewing'
  WHEN status = 'negotiation' THEN 'negotiation'
  WHEN status IN ('selected', 'won') THEN 'selected'
  WHEN status IN ('rejected', 'lost') THEN 'rejected'
  ELSE 'shortlisted'
END;

ALTER TABLE opportunity_proposed_premises
  ALTER COLUMN status SET DEFAULT 'shortlisted';
