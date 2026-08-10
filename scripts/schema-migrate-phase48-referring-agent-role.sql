-- Phase 48: referral is a party role, not a working-arrangement direction.
-- Preserve client/operator/landlord roles; convert only agent-like legacy parties.

UPDATE opportunity_parties
SET
  role = CASE
    WHEN role IN ('agent', 'referrer', 'other') THEN 'referring_agent'
    ELSE role
  END,
  partnership_mode = NULL
WHERE partnership_mode IN ('referral', 'outbound_referral');

UPDATE opportunity_parties
SET role = 'referring_agent'
WHERE role = 'referrer';
