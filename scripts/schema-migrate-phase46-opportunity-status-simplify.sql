-- Phase 46: Simplify opportunity status to 8 customer-expectation stages

BEGIN;

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_status_check;

UPDATE opportunities SET status = 'qualifying' WHERE status IN ('new_lead', 'qualifying', 'active_sourcing');
UPDATE opportunities SET status = 'proposal_review' WHERE status IN ('awaiting_client_feedback', 'refining_requirement');
UPDATE opportunities SET status = 'client_reviewing_options' WHERE status = 'awaiting_client_decision';
UPDATE opportunities SET status = 'negotiating' WHERE status = 'negotiating';
UPDATE opportunities SET status = 'pending_approval' WHERE status = 'awaiting_approval';
UPDATE opportunities SET status = 'contracting' WHERE status = 'contracting';
UPDATE opportunities SET status = 'closed_won' WHERE status = 'closed_won';
UPDATE opportunities SET status = 'closed_lost' WHERE status = 'closed_lost';

ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_status_check CHECK (status IN (
    'qualifying',
    'sourcing',
    'proposal_reviewing',
    'proposal_review',
    'client_reviewing_options',
    'negotiating',
    'pending_approval',
    'contracting',
    'closed_won',
    'closed_lost'
  ));

ALTER TABLE opportunities ALTER COLUMN status SET DEFAULT 'qualifying';

COMMIT;
