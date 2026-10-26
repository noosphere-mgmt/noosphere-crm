-- Extend the stage constraint without rewriting any opportunity or probability.
BEGIN;
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_status_check;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_status_check CHECK (status IN (
  'qualifying', 'sourcing', 'proposal_reviewing', 'negotiating',
  'contracting', 'await_payment', 'closed_won', 'closed_lost'
));
COMMIT;
