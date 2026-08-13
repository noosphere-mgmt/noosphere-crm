import { query } from "@/lib/db";
import { allocateNextBusinessId, ensureLegacyBusinessId, registerBusinessId } from "@/lib/businessIdResolve";
import {
  normalizeCategoryPreference,
  normalizeSpaceFormPreference,
} from "@/lib/opportunityPreferences";
import type {
  Opportunity,
  OpportunityLeadType,
  OpportunitySalesRole,
  OpportunityStatus,
} from "@/lib/types/entities";
import { normalizeOpportunitySource, type OpportunitySource } from "@/lib/opportunitySourceValues";
import { normalizeOpportunityStatus } from "@/lib/opportunityStatusModel";
import { normalizeOpportunitySalesRole } from "@/lib/opportunityValues";

const opportunitySelect = `
  o.id, o.client_name, o.lead_type, COALESCE(o.lead_source, 'direct') AS lead_source, o.company_name,
  o.company_id, o.primary_contact_id, o.referrer_company_id, o.referrer_contact_id,
  o.sales_role, o.lease_term,
  o.expected_close_date::text, o.lost_reason, o.relationship_owner,
  o.budget_min::text, o.budget_max::text, o.required_area_sqft::text,
  o.required_capacity_pax, o.district_preference, o.workspace_type,
  o.property_type, o.property_category_preference, o.property_type_preference,
  o.target_yield, o.funding_status,
  o.move_in_date::text, o.status,
  o.waiting_for, o.next_action, o.next_action_date::text,
  o.requirement_summary, o.remarks,
  o.created_at::text, o.updated_at::text,
  EXISTS (
    SELECT 1 FROM opportunity_proposed_premises pp
    WHERE pp.opportunity_id = o.id AND pp.status = 'viewing'
  ) AS has_viewing_premises,
  lc.company_name AS linked_company_name,
  lc.business_id AS linked_company_business_id,
  pc.contact_name AS primary_contact_name,
  pc.business_id AS primary_contact_business_id,
  rc.company_name AS referrer_company_name,
  rfc.contact_name AS referrer_contact_name,
  o.business_id,
  om.new_id AS v1_opportunity_id,
  fees.expected_fee::text AS expected_fee
  , COALESCE(activity.activity_count, 0)::int AS activity_count
  , activity.last_activity_date::text AS last_activity_date
  , activity.last_activity_type
`;

const opportunityFrom = `
  FROM opportunities o
  LEFT JOIN companies lc ON lc.id::text = o.company_id::text
  LEFT JOIN contacts pc ON pc.id::text = o.primary_contact_id::text
  LEFT JOIN companies rc ON rc.id::text = o.referrer_company_id::text
  LEFT JOIN contacts rfc ON rfc.id::text = o.referrer_contact_id::text
  LEFT JOIN id_map_v1 om ON om.entity_type = 'opportunity' AND om.legacy_id = o.id
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(op.collect_fee_amount) FILTER (
      WHERE COALESCE(op.collect_fee_status, 'expected') = 'expected'
    ), 0) AS expected_fee
    FROM opportunity_parties op
    WHERE op.opportunity_id = o.id
  ) fees ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS activity_count,
           MAX(a.activity_date) AS last_activity_date,
           (ARRAY_AGG(a.activity_type ORDER BY a.activity_date DESC, a.id DESC))[1] AS last_activity_type
    FROM activities a
    WHERE a.opportunity_id = o.id
  ) activity ON TRUE
`;

export type OpportunityInput = {
  client_name: string;
  lead_type?: OpportunityLeadType;
  lead_source?: OpportunitySource;
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
  property_category_preference?: string | null;
  property_type_preference?: string | null;
  target_yield?: string | null;
  funding_status?: string | null;
  move_in_date?: string | null;
  status?: OpportunityStatus;
  waiting_for?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  requirement_summary?: string | null;
  remarks?: string | null;
};

function opportunityValues(input: OpportunityInput) {
  const propertyType = input.property_type?.trim() || input.workspace_type?.trim() || null;
  return [
    input.client_name.trim(),
    input.lead_type ?? "direct_client",
    normalizeOpportunitySource(input.lead_source),
    input.company_name?.trim() || null,
    input.company_id ?? null,
    input.primary_contact_id ?? null,
    input.referrer_company_id ?? null,
    input.referrer_contact_id ?? null,
    normalizeOpportunitySalesRole(input.sales_role),
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
    normalizeCategoryPreference(input.property_category_preference),
    normalizeSpaceFormPreference(input.property_type_preference),
    input.target_yield?.trim() || null,
    input.funding_status?.trim() || null,
    input.move_in_date?.trim() || null,
    input.status ?? "qualifying",
    input.waiting_for?.trim() || null,
    input.next_action?.trim() || null,
    input.next_action_date?.trim() || null,
    input.requirement_summary?.trim() || null,
    input.remarks?.trim() || null,
  ];
}

function normalizeOpportunityRow(row: Opportunity): Opportunity {
  return {
    ...row,
    id: Number(row.id),
    company_id: row.company_id == null ? null : Number(row.company_id),
    primary_contact_id: row.primary_contact_id == null ? null : Number(row.primary_contact_id),
    referrer_company_id: row.referrer_company_id == null ? null : Number(row.referrer_company_id),
    referrer_contact_id: row.referrer_contact_id == null ? null : Number(row.referrer_contact_id),
    status: normalizeOpportunityStatus(String(row.status ?? "qualifying")),
    lead_source: normalizeOpportunitySource(row.lead_source),
    sales_role: normalizeOpportunitySalesRole(row.sales_role),
  };
}

export async function listOpportunities(companyId?: number): Promise<Opportunity[]> {
  if (companyId != null) {
    const rows = await query<Opportunity>(
      `SELECT ${opportunitySelect} ${opportunityFrom}
       WHERE o.company_id = $1
       ORDER BY o.updated_at DESC, o.id DESC`,
      [companyId],
    );
    return rows.map(normalizeOpportunityRow);
  }
  const rows = await query<Opportunity>(
    `SELECT ${opportunitySelect} ${opportunityFrom}
     ORDER BY o.updated_at DESC, o.id DESC`,
  );
  return rows.map(normalizeOpportunityRow);
}

export async function getOpportunity(id: number): Promise<Opportunity | null> {
  const rows = await query<Opportunity>(
    `SELECT ${opportunitySelect} ${opportunityFrom} WHERE o.id = $1`,
    [id],
  );
  return rows[0] ? normalizeOpportunityRow(rows[0]) : null;
}

export async function createOpportunity(input: OpportunityInput): Promise<number> {
  const businessId = await allocateNextBusinessId("opportunity");
  const rows = await query<{ id: string }>(
    `INSERT INTO opportunities (
       client_name, lead_type, lead_source, company_name, company_id, primary_contact_id, referrer_company_id,
       referrer_contact_id, sales_role, lease_term,
       expected_close_date, lost_reason, relationship_owner,
       budget_min, budget_max, required_area_sqft,
       required_capacity_pax, district_preference, workspace_type, property_type,
       property_category_preference, property_type_preference,
       target_yield, funding_status, move_in_date,
       status, waiting_for, next_action, next_action_date,
       requirement_summary, remarks, business_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
     RETURNING id::text AS id`,
    [...opportunityValues(input), businessId],
  );
  const id = Number.parseInt(rows[0]!.id, 10);
  await registerBusinessId({
    entityType: "opportunity",
    businessId,
    primaryRef: String(id),
    legacyNumeric: id,
  });
  return id;
}

export async function updateOpportunity(id: number, input: OpportunityInput): Promise<void> {
  const legacyId = Number(id);
  await query(
    `UPDATE opportunities SET
       client_name = $2, lead_type = $3, lead_source = $4, company_name = $5, company_id = $6, primary_contact_id = $7,
       referrer_company_id = $8, referrer_contact_id = $9, sales_role = $10, lease_term = $11,
       expected_close_date = $12, lost_reason = $13,
       relationship_owner = $14, budget_min = $15, budget_max = $16,
       required_area_sqft = $17, required_capacity_pax = $18, district_preference = $19,
       workspace_type = $20, property_type = $21,
       property_category_preference = $22, property_type_preference = $23,
       target_yield = $24, funding_status = $25,
       move_in_date = $26, status = $27,
       waiting_for = $28, next_action = $29, next_action_date = $30,
       requirement_summary = $31, remarks = $32
     WHERE id = $1`,
    [legacyId, ...opportunityValues(input)],
  );
  await ensureLegacyBusinessId("opportunity", legacyId);
}

export async function deleteOpportunity(id: number): Promise<void> {
  await query(`DELETE FROM opportunities WHERE id = $1`, [id]);
}

export async function bulkDeleteOpportunities(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await query(`DELETE FROM opportunities WHERE id = ANY($1::bigint[])`, [ids]);
}
