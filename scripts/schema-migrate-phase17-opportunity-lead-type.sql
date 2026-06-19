-- Phase 17: Opportunity Lead Type

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'direct_client';

CREATE INDEX IF NOT EXISTS idx_opportunities_lead_type ON opportunities(lead_type);

