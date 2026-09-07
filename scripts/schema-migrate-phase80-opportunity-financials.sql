-- Phase 80: Opportunity financials on the opportunity record.
-- Commission / Income and Related Costs persist on opportunities.
-- Net Profit is generated: COALESCE(commission_income, 0) - COALESCE(related_costs, 0)
-- when at least one of the two values is present.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS commission_income NUMERIC(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS related_costs NUMERIC(14, 2) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'opportunities'
       AND column_name = 'net_profit'
  ) THEN
    ALTER TABLE opportunities
      ADD COLUMN net_profit NUMERIC(14, 2)
      GENERATED ALWAYS AS (
        CASE
          WHEN commission_income IS NULL AND related_costs IS NULL THEN NULL
          ELSE COALESCE(commission_income, 0) - COALESCE(related_costs, 0)
        END
      ) STORED;
  END IF;
END $$;

-- Preserve any amounts previously saved on the sidecar table (phase 78).
-- The opportunity_commissions table is retained for history; application writes
-- go only to opportunities.commission_income / related_costs after this migration.
-- Only fill opportunity columns that are still empty so existing values are not overwritten.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
     WHERE table_schema = current_schema() AND table_name = 'opportunity_commissions'
  ) THEN
    UPDATE opportunities o
       SET commission_income = CASE
             WHEN o.commission_income IS NOT NULL THEN o.commission_income
             WHEN oc.fee_from_seller IS NULL
              AND oc.fee_from_buyer IS NULL
              AND oc.fee_from_operator_landlord IS NULL
              AND oc.fee_from_tenant IS NULL THEN NULL
             ELSE COALESCE(oc.fee_from_seller, 0)
                + COALESCE(oc.fee_from_buyer, 0)
                + COALESCE(oc.fee_from_operator_landlord, 0)
                + COALESCE(oc.fee_from_tenant, 0)
           END,
           related_costs = COALESCE(o.related_costs, oc.payout_amount)
      FROM opportunity_commissions oc
     WHERE oc.opportunity_id = o.id;
  END IF;
END $$;
