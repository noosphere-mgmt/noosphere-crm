CREATE TABLE IF NOT EXISTS opportunity_commissions (
  opportunity_id BIGINT PRIMARY KEY REFERENCES opportunities(id) ON DELETE CASCADE,
  fee_from_seller NUMERIC(14, 2) NULL,
  fee_from_buyer NUMERIC(14, 2) NULL,
  fee_from_operator_landlord NUMERIC(14, 2) NULL,
  fee_from_tenant NUMERIC(14, 2) NULL,
  payout_amount NUMERIC(14, 2) NULL,
  payout_company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
  payout_contact_id BIGINT NULL REFERENCES contacts(id) ON DELETE SET NULL,
  remarks TEXT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
