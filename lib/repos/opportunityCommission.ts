/**
 * Legacy phase-78 sidecar. Historical rows are preserved.
 *
 * Canonical Opportunity financials are `opportunities.commission_income`,
 * `related_costs`, and generated `net_profit` (phase 80). Do not write this
 * table from application code — phase 80 migrates existing totals once.
 */
import { query } from "@/lib/db";

export type OpportunityCommission = {
  opportunity_id: number;
  fee_from_seller: string | null;
  fee_from_buyer: string | null;
  fee_from_operator_landlord: string | null;
  fee_from_tenant: string | null;
  payout_amount: string | null;
  payout_company_id: number | null;
  payout_contact_id: number | null;
  remarks: string | null;
  payout_company_name?: string | null;
  payout_contact_name?: string | null;
};

/** Read-only compatibility accessor for historical sidecar rows / backfill audits. */
export async function getOpportunityCommission(opportunityId: number): Promise<OpportunityCommission | null> {
  const rows = await query<OpportunityCommission>(
    `SELECT oc.opportunity_id, oc.fee_from_seller::text, oc.fee_from_buyer::text,
            oc.fee_from_operator_landlord::text, oc.fee_from_tenant::text,
            oc.payout_amount::text, oc.payout_company_id, oc.payout_contact_id, oc.remarks,
            c.company_name AS payout_company_name, ct.contact_name AS payout_contact_name
       FROM opportunity_commissions oc
       LEFT JOIN companies c ON c.id = oc.payout_company_id
       LEFT JOIN contacts ct ON ct.id = oc.payout_contact_id
      WHERE oc.opportunity_id = $1`,
    [opportunityId],
  );
  return rows[0] ?? null;
}
