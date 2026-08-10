import { query } from "@/lib/db";
import { normalizePremisesRelationshipLines } from "@/lib/premisesRelationships";
import {
  parseCategoryPreferenceList,
  parseSpaceFormPreferenceList,
} from "@/lib/opportunityPreferences";
import type { PremisesWithBuilding } from "@/lib/proposals/snapshots";
import type {
  OpportunityProposal,
  OpportunityProposalItem,
  ProposalLanguage,
} from "@/lib/types/entities";

const proposalSelect = `
  p.id,
  p.opportunity_id,
  p.title,
  p.proposal_date::text,
  p.language,
  p.status,
  p.version_number,
  p.supersedes_id,
  p.prepared_for_company_id,
  p.prepared_for_contact_id,
  p.template_key,
  p.executive_summary,
  p.consultancy_advice,
  p.output_file,
  p.sent_date::text,
  p.remarks,
  p.created_at::text,
  p.updated_at::text,
  co.company_name AS prepared_for_company_name,
  ct.contact_name AS prepared_for_contact_name
`;

const itemSelect = `
  i.id,
  i.proposal_id,
  i.premises_id,
  i.proposed_premises_id,
  i.rank,
  i.recommended,
  i.recommendation_label,
  i.display_rent,
  i.net_effective_rent::text,
  i.total_initial_cost::text,
  i.pros,
  i.cons,
  i.advisor_comment,
  i.pricing_snapshot,
  i.premises_snapshot,
  i.media_snapshot,
  i.created_at::text,
  i.updated_at::text,
  pm.business_id AS premises_business_id,
  pv.bldg_name_en AS building_name
`;

function parseJson<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === "object") return v as T;
  try {
    return JSON.parse(String(v)) as T;
  } catch {
    return null;
  }
}

function mapItem(row: Record<string, unknown>): OpportunityProposalItem {
  return {
    id: Number(row.id),
    proposal_id: Number(row.proposal_id),
    premises_id: String(row.premises_id),
    proposed_premises_id: row.proposed_premises_id != null ? Number(row.proposed_premises_id) : null,
    rank: row.rank != null ? Number(row.rank) : null,
    recommended: Boolean(row.recommended),
    recommendation_label: (row.recommendation_label as string) ?? null,
    display_rent: (row.display_rent as string) ?? null,
    net_effective_rent: (row.net_effective_rent as string) ?? null,
    total_initial_cost: (row.total_initial_cost as string) ?? null,
    pros: (row.pros as string) ?? null,
    cons: (row.cons as string) ?? null,
    advisor_comment: (row.advisor_comment as string) ?? null,
    pricing_snapshot: parseJson(row.pricing_snapshot),
    premises_snapshot: parseJson(row.premises_snapshot),
    media_snapshot: parseJson(row.media_snapshot),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    premises_business_id: (row.premises_business_id as string) ?? null,
    building_name: (row.building_name as string) ?? null,
  };
}

function mapProposal(row: OpportunityProposal): OpportunityProposal {
  return {
    ...row,
    id: Number(row.id),
    opportunity_id: Number(row.opportunity_id),
    version_number: Number(row.version_number),
    supersedes_id: row.supersedes_id != null ? Number(row.supersedes_id) : null,
    prepared_for_company_id:
      row.prepared_for_company_id != null ? Number(row.prepared_for_company_id) : null,
    prepared_for_contact_id:
      row.prepared_for_contact_id != null ? Number(row.prepared_for_contact_id) : null,
  };
}

export async function listProposalsForOpportunity(opportunityId: number): Promise<OpportunityProposal[]> {
  const rows = await query<OpportunityProposal>(
    `SELECT ${proposalSelect}
     FROM opportunity_proposals p
     LEFT JOIN companies co ON co.id = p.prepared_for_company_id
     LEFT JOIN contacts ct ON ct.id = p.prepared_for_contact_id
     WHERE p.opportunity_id = $1
     ORDER BY p.created_at DESC, p.id DESC`,
    [opportunityId],
  );
  return rows.map(mapProposal);
}

export async function getProposal(proposalId: number): Promise<OpportunityProposal | null> {
  const rows = await query<OpportunityProposal>(
    `SELECT ${proposalSelect}
     FROM opportunity_proposals p
     LEFT JOIN companies co ON co.id = p.prepared_for_company_id
     LEFT JOIN contacts ct ON ct.id = p.prepared_for_contact_id
     WHERE p.id = $1`,
    [proposalId],
  );
  const row = rows[0];
  return row ? mapProposal(row) : null;
}

export async function deleteProposal(proposalId: number): Promise<void> {
  await query(`DELETE FROM opportunity_proposals WHERE id = $1`, [proposalId]);
}

export async function listProposalItems(proposalId: number): Promise<OpportunityProposalItem[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${itemSelect}
     FROM opportunity_proposal_items i
     JOIN premises_v1 pm ON pm.premises_id = i.premises_id
     JOIN properties_v1 pv ON pv.property_id = pm.property_id
     WHERE i.proposal_id = $1
     ORDER BY i.rank ASC NULLS LAST, i.id ASC`,
    [proposalId],
  );
  return rows.map(mapItem);
}

export type CreateProposalInput = {
  opportunityId: number;
  title: string;
  language?: ProposalLanguage;
  proposalDate?: string | null;
  preparedForCompanyId?: number | null;
  preparedForContactId?: number | null;
  executiveSummary?: string | null;
  consultancyAdvice?: string | null;
  versionNumber?: number;
  supersedesId?: number | null;
};

export async function createProposal(input: CreateProposalInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO opportunity_proposals (
       opportunity_id, title, proposal_date, language,
       prepared_for_company_id, prepared_for_contact_id,
       executive_summary, consultancy_advice,
       version_number, supersedes_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id::text AS id`,
    [
      input.opportunityId,
      input.title,
      input.proposalDate?.slice(0, 10) ?? null,
      input.language ?? "en",
      input.preparedForCompanyId ?? null,
      input.preparedForContactId ?? null,
      input.executiveSummary?.trim() || null,
      input.consultancyAdvice?.trim() || null,
      input.versionNumber ?? 1,
      input.supersedesId ?? null,
    ],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export type ProposalItemInsert = {
  premisesId: string;
  proposedPremisesId?: number | null;
  rank: number;
  recommended?: boolean;
  displayRent?: string | null;
  netEffectiveRent?: number | null;
  totalInitialCost?: number | null;
  advisorComment?: string | null;
  pricingSnapshot: unknown;
  premisesSnapshot: unknown;
  mediaSnapshot: unknown;
};

export async function insertProposalItem(proposalId: number, item: ProposalItemInsert): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO opportunity_proposal_items (
       proposal_id, premises_id, proposed_premises_id, rank, recommended,
       display_rent, net_effective_rent, total_initial_cost, advisor_comment,
       pricing_snapshot, premises_snapshot, media_snapshot
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb)
     RETURNING id::text AS id`,
    [
      proposalId,
      item.premisesId,
      item.proposedPremisesId ?? null,
      item.rank,
      item.recommended ?? false,
      item.displayRent ?? null,
      item.netEffectiveRent ?? null,
      item.totalInitialCost ?? null,
      item.advisorComment?.trim() || null,
      JSON.stringify(item.pricingSnapshot),
      JSON.stringify(item.premisesSnapshot),
      JSON.stringify(item.mediaSnapshot),
    ],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function getPremisesWithBuilding(premisesId: string): Promise<PremisesWithBuilding | null> {
  const rows = await query<PremisesWithBuilding & { relationship_lines: unknown }>(
    `SELECT
       pm.premises_id,
       pm.business_id,
       pm.property_id,
       pm.property_name_en,
       pm.property_name_zh,
       pm.property_category,
       pm.space_form,
       pm.floor,
       pm.unit,
       pm.capacity_pax,
       pm.operating_model,
       pm.gross_area_sqft::text AS gross_area_sqft,
       pm.net_area_sqft::text AS net_area_sqft,
       pm.monthly_rent::text AS monthly_rent,
       pm.rent_psf::text AS rent_psf,
       pm.rent_free_period,
       pm.contract_term_months,
       pm.management_fee::text AS management_fee,
       pm.deposit_months,
       pm.asking_sale_price::text AS asking_sale_price,
       pm.currency,
       pm.source_file,
       pm.source_url,
       pm.relationship_lines,
       pv.bldg_name_en,
       pv.bldg_name_zh,
       pv.bldg_name_cn,
       pv.district_en,
       pv.business_id AS building_business_id
     FROM premises_v1 pm
     JOIN properties_v1 pv ON pv.property_id = pm.property_id
     WHERE pm.premises_id = $1`,
    [premisesId],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    relationship_lines: normalizePremisesRelationshipLines(row.relationship_lines),
  };
}

export function shortlistLinePassesCategoryGuard(
  line: { property_category?: string | null; space_form?: string | null },
  categoryPreference: string | null | undefined,
  spaceFormPreference: string | null | undefined,
): boolean {
  const categories = parseCategoryPreferenceList(categoryPreference);
  if (categories.length > 0) {
    const cat = (line.property_category ?? "").trim();
    if (!cat || !categories.includes(cat as (typeof categories)[number])) return false;
  }
  const forms = parseSpaceFormPreferenceList(spaceFormPreference);
  if (forms.length > 0) {
    const form = (line.space_form ?? "").trim();
    if (!form || !forms.includes(form as (typeof forms)[number])) return false;
  }
  return true;
}

export type UpdateProposalInput = {
  title?: string;
  proposalDate?: string | null;
  language?: ProposalLanguage;
  preparedForCompanyId?: number | null;
  preparedForContactId?: number | null;
  executiveSummary?: string | null;
  consultancyAdvice?: string | null;
  remarks?: string | null;
};

export async function updateProposal(proposalId: number, input: UpdateProposalInput): Promise<void> {
  await query(
    `UPDATE opportunity_proposals SET
       title = COALESCE($2, title),
       proposal_date = $3,
       language = COALESCE($4, language),
       prepared_for_company_id = $5,
       prepared_for_contact_id = $6,
       executive_summary = $7,
       consultancy_advice = $8,
       remarks = $9
     WHERE id = $1`,
    [
      proposalId,
      input.title ?? null,
      input.proposalDate?.slice(0, 10) ?? null,
      input.language ?? null,
      input.preparedForCompanyId ?? null,
      input.preparedForContactId ?? null,
      input.executiveSummary?.trim() ?? null,
      input.consultancyAdvice?.trim() ?? null,
      input.remarks?.trim() ?? null,
    ],
  );
}

export type UpdateProposalItemInput = {
  rank?: number | null;
  recommended?: boolean;
  recommendationLabel?: string | null;
  displayRent?: string | null;
  netEffectiveRent?: number | null;
  totalInitialCost?: number | null;
  pros?: string | null;
  cons?: string | null;
  advisorComment?: string | null;
  pricingSnapshot?: unknown;
};

export async function updateProposalItem(itemId: number, input: UpdateProposalItemInput): Promise<void> {
  await query(
    `UPDATE opportunity_proposal_items SET
       rank = COALESCE($2, rank),
       recommended = COALESCE($3, recommended),
       recommendation_label = $4,
       display_rent = $5,
       net_effective_rent = $6,
       total_initial_cost = $7,
       pros = $8,
       cons = $9,
       advisor_comment = $10,
       pricing_snapshot = COALESCE($11::jsonb, pricing_snapshot)
     WHERE id = $1`,
    [
      itemId,
      input.rank ?? null,
      input.recommended ?? null,
      input.recommendationLabel?.trim() ?? null,
      input.displayRent?.trim() ?? null,
      input.netEffectiveRent ?? null,
      input.totalInitialCost ?? null,
      input.pros?.trim() ?? null,
      input.cons?.trim() ?? null,
      input.advisorComment?.trim() ?? null,
      input.pricingSnapshot != null ? JSON.stringify(input.pricingSnapshot) : null,
    ],
  );
}

export async function setProposalOutputFile(proposalId: number, relativePath: string): Promise<void> {
  await query(`UPDATE opportunity_proposals SET output_file = $2 WHERE id = $1`, [proposalId, relativePath]);
}

export async function markProposalSent(proposalId: number, sentDate: string): Promise<void> {
  await query(
    `UPDATE opportunity_proposals SET status = 'sent', sent_date = $2 WHERE id = $1`,
    [proposalId, sentDate.slice(0, 10)],
  );
}

export async function markProposalSuperseded(proposalId: number): Promise<void> {
  await query(`UPDATE opportunity_proposals SET status = 'superseded' WHERE id = $1`, [proposalId]);
}

export async function assertProposalDraft(proposalId: number): Promise<OpportunityProposal> {
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "draft") throw new Error("Only draft proposals can be edited");
  return proposal;
}

export async function getLatestProposalVersionNumber(opportunityId: number): Promise<number> {
  const rows = await query<{ max_v: string }>(
    `SELECT COALESCE(MAX(version_number), 0)::text AS max_v
     FROM opportunity_proposals WHERE opportunity_id = $1`,
    [opportunityId],
  );
  return Number.parseInt(rows[0]?.max_v ?? "0", 10);
}

export async function deleteProposalItem(itemId: number): Promise<void> {
  await query(`DELETE FROM opportunity_proposal_items WHERE id = $1`, [itemId]);
}

export async function refreshItemSnapshots(
  itemId: number,
  snapshots: {
    pricingSnapshot: unknown;
    premisesSnapshot: unknown;
    mediaSnapshot: unknown;
    displayRent: string;
    netEffectiveRent: number | null;
    totalInitialCost: number | null;
  },
): Promise<void> {
  await query(
    `UPDATE opportunity_proposal_items SET
       pricing_snapshot = $2::jsonb,
       premises_snapshot = $3::jsonb,
       media_snapshot = $4::jsonb,
       display_rent = $5,
       net_effective_rent = $6,
       total_initial_cost = $7
     WHERE id = $1`,
    [
      itemId,
      JSON.stringify(snapshots.pricingSnapshot),
      JSON.stringify(snapshots.premisesSnapshot),
      JSON.stringify(snapshots.mediaSnapshot),
      snapshots.displayRent,
      snapshots.netEffectiveRent,
      snapshots.totalInitialCost,
    ],
  );
}
