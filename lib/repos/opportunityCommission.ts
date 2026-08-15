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

export async function upsertOpportunityCommission(opportunityId: number, input: Omit<OpportunityCommission, "opportunity_id">): Promise<void> {
  await query(
    `INSERT INTO opportunity_commissions
      (opportunity_id, fee_from_seller, fee_from_buyer, fee_from_operator_landlord, fee_from_tenant,
       payout_amount, payout_company_id, payout_contact_id, remarks)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (opportunity_id) DO UPDATE SET
       fee_from_seller = EXCLUDED.fee_from_seller, fee_from_buyer = EXCLUDED.fee_from_buyer,
       fee_from_operator_landlord = EXCLUDED.fee_from_operator_landlord, fee_from_tenant = EXCLUDED.fee_from_tenant,
       payout_amount = EXCLUDED.payout_amount, payout_company_id = EXCLUDED.payout_company_id,
       payout_contact_id = EXCLUDED.payout_contact_id, remarks = EXCLUDED.remarks, updated_at = NOW()`,
    [opportunityId, input.fee_from_seller, input.fee_from_buyer, input.fee_from_operator_landlord,
      input.fee_from_tenant, input.payout_amount, input.payout_company_id, input.payout_contact_id, input.remarks],
  );
}
