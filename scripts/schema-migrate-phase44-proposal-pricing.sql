-- Phase 44 (R3): Proposal item snapshots (pricing, premises, media)

ALTER TABLE opportunity_proposal_items
  ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB NULL,
  ADD COLUMN IF NOT EXISTS premises_snapshot JSONB NULL,
  ADD COLUMN IF NOT EXISTS media_snapshot JSONB NULL;
