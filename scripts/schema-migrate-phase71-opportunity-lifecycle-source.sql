-- Phase 71: simplified opportunity lifecycle and standardized source values.
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_status_check;

UPDATE opportunities
SET status = CASE
  WHEN status IN ('sourcing', 'active_sourcing') THEN 'sourcing'
  WHEN status IN ('proposal_review', 'proposal_reviewing', 'client_reviewing_options',
                  'proposal_preparing', 'proposal_sent', 'awaiting_client_feedback',
                  'refining_requirement', 'awaiting_client_decision') THEN 'proposal_reviewing'
  WHEN status IN ('pending_approval', 'contracting', 'awaiting_approval') THEN 'negotiating'
  WHEN status IN ('closed_won', 'closed_lost', 'negotiating', 'qualifying') THEN status
  ELSE 'qualifying'
END;

ALTER TABLE opportunities
  ADD CONSTRAINT opportunities_status_check CHECK (status IN (
    'qualifying',
    'sourcing',
    'proposal_reviewing',
    'negotiating',
    'closed_won',
    'closed_lost'
  ));

ALTER TABLE opportunities ALTER COLUMN lead_source SET DEFAULT 'direct';

UPDATE opportunities
SET lead_source = CASE
  WHEN lower(replace(coalesce(lead_source, ''), ' ', '_')) IN ('partner_agent', 'partner_agents', 'referral') THEN 'partner_agents'
  WHEN lower(replace(coalesce(lead_source, ''), ' ', '_')) IN ('emarketing', 'e_marketing', 'email', 'email_marketing') THEN 'emarketing'
  ELSE 'direct'
END;
