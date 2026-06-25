import { query } from "@/lib/db";
import type {
  Opportunity,
  OpportunityLeadType,
  OpportunitySalesRole,
  OpportunityStatus,
} from "@/lib/types/entities";

const opportunitySelect = `
  o.id, o.client_name, o.lead_type, o.company_name,
  o.company_id, o.primary_contact_id, o.referrer_company_id, o.referrer_contact_id,
  o.sales_role, o.lease_term,
  o.expected_close_date::text, o.lost_reason, o.relationship_owner,
  o.budget_min::text, o.budget_max::text, o.required_area_sqft::text,
  o.required_capacity_pax, o.district_preference, o.workspace_type,
  o.property_type, o.target_yield, o.funding_status,
  o.move_in_date::text, o.status, o.requirement_summary, o.remarks,
  o.created_at::text, o.updated_at::text,
  EXISTS (
    SELECT 1 FROM opportunity_proposed_premises pp
    WHERE pp.opportunity_id = o.id AND pp.status = 'viewing'
  ) AS has_viewing_premises,
  lc.company_name AS linked_company_name,
  pc.contact_name AS primary_contact_name,
  rc.company_name AS referrer_company_name,
  rfc.contact_name AS referrer_contact_name,
  o.business_id,
  om.new_id AS v1_opportunity_id
`;

const opportunityFrom = `
  FROM opportunities o
  LEFT JOIN companies lc ON lc.id::text = o.company_id::text
  LEFT JOIN contacts pc ON pc.id::text = o.primary_contact_id::text
  LEFT JOIN companies rc ON rc.id::text = o.referrer_company_id::text
  LEFT JOIN contacts rfc ON rfc.id::text = o.referrer_contact_id::text
  LEFT JOIN id_map_v1 om ON om.entity_type = 'opportunity' AND om.legacy_id = o.id
`;

export type OpportunityInput = {
  client_name: string;
  lead_type?: OpportunityLeadType;
  company_name?: string | null;
  company_id?: number | null;
  primary_contact_id?: number | null;
  referrer_company_id?: number | null;
  referrer_contact_id?: number | null;
  sales_role?: OpportunitySalesRole;
  lease_term?: string | null;
  expected_close_date?: string | null;
  lost_reason?: string | null;
  relationship_owner?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  required_area_sqft?: number | null;
  required_capacity_pax?: number | null;
  district_preference?: string | null;
  workspace_type?: string | null;
  property_type?: string | null;
  target_yield?: string | null;
  funding_status?: string | null;
  move_in_date?: string | null;
  status?: OpportunityStatus;
  requirement_summary?: string | null;
  remarks?: string | null;
};

function opportunityValues(input: OpportunityInput) {
  const propertyType = input.property_type?.trim() || input.workspace_type?.trim() || null;
  return [
    input.client_name.trim(),
    input.lead_type ?? "direct_client",
    input.company_name?.trim() || null,
    input.company_id ?? null,
    input.primary_contact_id ?? null,
    input.referrer_company_id ?? null,
    input.referrer_contact_id ?? null,
    input.sales_role ?? "to_lease",
    input.lease_term?.trim() || null,
    input.expected_close_date?.trim() || null,
    input.lost_reason?.trim() || null,
    input.relationship_owner?.trim() || null,
    input.budget_min ?? null,
    input.budget_max ?? null,
    input.required_area_sqft ?? null,
    input.required_capacity_pax ?? null,
    input.district_preference?.trim() || null,
    propertyType,
    propertyType,
    input.target_yield?.trim() || null,
    input.funding_status?.trim() || null,
    input.move_in_date?.trim() || null,
    input.status ?? "new",
    input.requirement_summary?.trim() || null,
    input.remarks?.trim() || null,
  ];
}

export async function listOpportunities(companyId?: number): Promise<Opportunity[]> {
  if (companyId != null) {
    return query<Opportunity>(
      `SELECT ${opportunitySelect} ${opportunityFrom}
       WHERE o.company_id = $1
       ORDER BY o.updated_at DESC, o.id DESC`,
      [companyId],
    );
  }
  return query<Opportunity>(
    `SELECT ${opportunitySelect} ${opportunityFrom}
     ORDER BY o.updated_at DESC, o.id DESC`,
  );
}

export async function getOpportunity(id: number): Promise<Opportunity | null> {
  const rows = await query<Opportunity>(
    `SELECT ${opportunitySelect} ${opportunityFrom} WHERE o.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createOpportunity(input: OpportunityInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO opportunities (
       client_name, lead_type, company_name, company_id, primary_contact_id, referrer_company_id,
       referrer_contact_id, sales_role, lease_term,
       expected_close_date, lost_reason, relationship_owner,
       budget_min, budget_max, required_area_sqft,
       required_capacity_pax, district_preference, workspace_type, property_type,
       target_yield, funding_status, move_in_date,
       status, requirement_summary, remarks
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
     RETURNING id::text AS id`,
    opportunityValues(input),
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateOpportunity(id: number, input: OpportunityInput): Promise<void> {
  await query(
    `UPDATE opportunities SET
       client_name = $2, lead_type = $3, company_name = $4, company_id = $5, primary_contact_id = $6,
       referrer_company_id = $7, referrer_contact_id = $8, sales_role = $9, lease_term = $10,
       expected_close_date = $11, lost_reason = $12,
       relationship_owner = $13, budget_min = $14, budget_max = $15,
       required_area_sqft = $16, required_capacity_pax = $17, district_preference = $18,
       workspace_type = $19, property_type = $20, target_yield = $21, funding_status = $22,
       move_in_date = $23, status = $24,
       requirement_summary = $25, remarks = $26
     WHERE id = $1`,
    [id, ...opportunityValues(input)],
  );
}

export async function deleteOpportunity(id: number): Promise<void> {
  await query(`DELETE FROM opportunities WHERE id = $1`, [id]);
}

export async function bulkDeleteOpportunities(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await query(`DELETE FROM opportunities WHERE id = ANY($1::bigint[])`, [ids]);
}
