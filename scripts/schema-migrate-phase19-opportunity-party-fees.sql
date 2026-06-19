-- Phase 19: Party fee fields on opportunity_parties

ALTER TABLE opportunity_parties
  ADD COLUMN IF NOT EXISTS collect_fee_amount NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS collect_fee_percent NUMERIC(8, 4) NULL,
  ADD COLUMN IF NOT EXISTS paid_out_fee_amount NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS paid_out_fee_percent NUMERIC(8, 4) NULL,
  ADD COLUMN IF NOT EXISTS collect_fee_status TEXT NULL DEFAULT 'expected'
    CHECK (collect_fee_status IS NULL OR collect_fee_status IN (
      'expected', 'confirmed', 'invoiced', 'paid', 'waived', 'not_applicable'
    ));
