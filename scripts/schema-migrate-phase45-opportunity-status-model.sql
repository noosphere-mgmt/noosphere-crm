-- Phase 45: Real-estate brokerage opportunity status model + operational fields

BEGIN;

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS waiting_for TEXT NULL,
  ADD COLUMN IF NOT EXISTS next_action TEXT NULL,
  ADD COLUMN IF NOT EXISTS next_action_date DATE NULL;

ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_status_check;

-- Map legacy pipeline statuses to business-situation statuses
UPDATE opportunities SET status = 'new_lead' WHERE status = 'new';
UPDATE opportunities SET status = 'active_sourcing' WHERE status IN ('sourcing', 'proposal_preparing');
UPDATE opportunities SET status = 'awaiting_client_feedback' WHERE status = 'proposal_sent';

ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_status_check CHECK (status IN (
    'new_lead',
    'qualifying',
    'active_sourcing',
    'awaiting_client_feedback',
    'refining_requirement',
    'awaiting_client_decision',
    'negotiating',
    'awaiting_approval',
    'contracting',
    'closed_won',
    'closed_lost'
  ));

ALTER TABLE opportunities ALTER COLUMN status SET DEFAULT 'new_lead';

UPDATE opportunities
SET waiting_for = 'Client response'
WHERE status = 'awaiting_client_feedback'
  AND (waiting_for IS NULL OR TRIM(waiting_for) = '');

COMMIT;
