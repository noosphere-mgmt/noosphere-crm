import { query } from "@/lib/db";
import { sqlJoinV1Company } from "@/lib/import/lookupSql";
import type {
  FeeStatus,
  OpportunityProposedPremises,
  ProposedPremisesPreference,
  ProposedPremisesStatus,
} from "@/lib/types/entities";

const select = `
  opp.id,
  opp.opportunity_id,
  opp.premises_id,
  opp.rank,
  opp.preference,
  opp.status,
  opp.proposed_date::text,
  opp.tour_date::text,
  opp.proposed_price::text,
  opp.proposed_price_psf::text,
  opp.client_comment,
  opp.advisor_comment,
  opp.remarks,
  opp.related_company_id,
  opp.related_contact_id,
  opp.related_role,
  opp.partnership_mode,
  opp.collect_fee_amount::text,
  opp.collect_fee_basis,
  opp.collect_fee_from_company_id,
  opp.collect_fee_status,
  opp.paid_out_fee_amount::text,
  opp.paid_out_fee_basis,
  opp.paid_out_to_company_id,
  opp.paid_out_status,
  opp.fee_remarks,
  opp.created_at::text,
  opp.updated_at::text,
  pr.bldg_name_en AS building_name,
  p.floor,
  p.unit,
  p.gross_area_sqft::text AS gross_area_sqft,
  p.workstation_count::text AS workstation_count,
  p.capacity_pax,
  p.monthly_rent::text AS monthly_rent,
  p.asking_sale_price::text AS asking_sale_price,
  p.inventory_status,
  p.offer_type,
  p.offer_status,
  COALESCE(p.currency, 'HKD') AS currency,
  p.operating_model,
  op_co.company_name_en AS operator_name,
  own_co.company_name_en AS owner_name,
  tour_act.site_tour_activity_date::text AS site_tour_activity_date,
  rel_co.company_name AS related_company_name,
  rel_ct.contact_name AS related_contact_name,
  cfc.company_name AS collect_fee_from_company_name,
  ptc.company_name AS paid_out_to_company_name
`;

const from = `
  FROM opportunity_proposed_premises opp
  JOIN premises_v1 p ON p.premises_id = opp.premises_id
  JOIN properties_v1 pr ON pr.property_id = p.property_id
  LEFT JOIN companies_v1 op_co ON ${sqlJoinV1Company("op_co", "p.operator_company_id")}
  LEFT JOIN companies_v1 own_co ON ${sqlJoinV1Company("own_co", "COALESCE(p.operator_company_id, p.owner_company_id, p.landlord_company_id)")}
  LEFT JOIN companies rel_co ON rel_co.id = opp.related_company_id
  LEFT JOIN contacts rel_ct ON rel_ct.id = opp.related_contact_id
  LEFT JOIN companies cfc ON cfc.id = opp.collect_fee_from_company_id
  LEFT JOIN companies ptc ON ptc.id = opp.paid_out_to_company_id
  LEFT JOIN LATERAL (
    SELECT a.activity_date AS site_tour_activity_date
    FROM activities a
    LEFT JOIN activity_premises ap ON ap.activity_id = a.activity_id
    WHERE a.opportunity_id = opp.opportunity_id
      AND (a.premises_id = opp.premises_id OR ap.premises_id = opp.premises_id)
      AND a.activity_type IN ('Site Tour', 'Site Inspection')
    ORDER BY a.activity_date DESC, a.id DESC
    LIMIT 1
  ) tour_act ON TRUE
`;

export type ProposedPremisesInput = {
  rank?: number | null;
  preference?: ProposedPremisesPreference | null;
  status?: ProposedPremisesStatus;
  tour_date?: string | null;
  proposed_price?: number | null;
  proposed_price_psf?: number | null;
  client_comment?: string | null;
  advisor_comment?: string | null;
  remarks?: string | null;
  collect_fee_amount?: number | null;
  collect_fee_basis?: string | null;
  collect_fee_from_company_id?: number | null;
  collect_fee_status?: FeeStatus | null;
  paid_out_fee_amount?: number | null;
  paid_out_fee_basis?: string | null;
  paid_out_to_company_id?: number | null;
  paid_out_status?: FeeStatus | null;
  fee_remarks?: string | null;
};

function inputValues(input: ProposedPremisesInput) {
  return [
    input.preference ?? null,
    input.status ?? "proposed",
    input.tour_date?.trim() || null,
    input.proposed_price ?? null,
    input.proposed_price_psf ?? null,
    input.client_comment?.trim() || null,
    input.advisor_comment?.trim() || null,
    input.remarks?.trim() || null,
    input.collect_fee_amount ?? null,
    input.collect_fee_basis?.trim() || null,
    input.collect_fee_from_company_id ?? null,
    input.collect_fee_status ?? null,
    input.paid_out_fee_amount ?? null,
    input.paid_out_fee_basis?.trim() || null,
    input.paid_out_to_company_id ?? null,
    input.paid_out_status ?? null,
    input.fee_remarks?.trim() || null,
  ];
}

export async function listProposedPremisesForOpportunity(
  opportunityId: number,
): Promise<OpportunityProposedPremises[]> {
  return query<OpportunityProposedPremises>(
    `SELECT ${select} ${from}
     WHERE opp.opportunity_id = $1
     ORDER BY
       CASE opp.preference WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
       opp.tour_date DESC NULLS LAST,
       opp.id ASC`,
    [opportunityId],
  );
}

export async function getProposedPremisesLine(id: number): Promise<OpportunityProposedPremises | null> {
  const rows = await query<OpportunityProposedPremises>(
    `SELECT ${select} ${from} WHERE opp.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function addProposedPremises(
  opportunityId: number,
  premisesIds: string[],
): Promise<number> {
  if (premisesIds.length === 0) return 0;
  const rows = await query<{ id: string }>(
    `INSERT INTO opportunity_proposed_premises (opportunity_id, premises_id)
     SELECT $1, unnest($2::text[])
     ON CONFLICT (opportunity_id, premises_id) DO NOTHING
     RETURNING id::text AS id`,
    [opportunityId, premisesIds],
  );
  return rows.length;
}

export async function updateProposedPremisesLine(
  id: number,
  input: ProposedPremisesInput,
): Promise<void> {
  const v = inputValues(input);
  await query(
    `UPDATE opportunity_proposed_premises SET
       preference = $2, status = $3,
       tour_date = $4, proposed_price = $5, proposed_price_psf = $6,
       client_comment = $7, advisor_comment = $8, remarks = $9,
       collect_fee_amount = $10, collect_fee_basis = $11, collect_fee_from_company_id = $12,
       collect_fee_status = $13,
       paid_out_fee_amount = $14, paid_out_fee_basis = $15, paid_out_to_company_id = $16,
       paid_out_status = $17, fee_remarks = $18
     WHERE id = $1`,
    [id, ...v],
  );
}

function parseLineDecimal(v: string | null | undefined): number | null {
  if (!v?.trim()) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function proposedPremisesLineToInput(line: OpportunityProposedPremises): ProposedPremisesInput {
  return {
    preference: line.preference,
    status: line.status,
    tour_date: line.tour_date?.slice(0, 10) ?? null,
    proposed_price: parseLineDecimal(line.proposed_price),
    proposed_price_psf: parseLineDecimal(line.proposed_price_psf),
    client_comment: line.client_comment,
    advisor_comment: line.advisor_comment,
    remarks: line.remarks,
    collect_fee_amount: parseLineDecimal(line.collect_fee_amount),
    collect_fee_basis: line.collect_fee_basis,
    collect_fee_from_company_id: line.collect_fee_from_company_id,
    collect_fee_status: line.collect_fee_status,
    paid_out_fee_amount: parseLineDecimal(line.paid_out_fee_amount),
    paid_out_fee_basis: line.paid_out_fee_basis,
    paid_out_to_company_id: line.paid_out_to_company_id,
    paid_out_status: line.paid_out_status,
    fee_remarks: line.fee_remarks,
  };
}

export async function patchProposedPremisesLine(
  id: number,
  patch: Partial<ProposedPremisesInput>,
): Promise<void> {
  const line = await getProposedPremisesLine(id);
  if (!line) throw new Error("Proposed premises line not found");
  await updateProposedPremisesLine(id, { ...proposedPremisesLineToInput(line), ...patch });
}

export async function deleteProposedPremisesLines(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await query(`DELETE FROM opportunity_proposed_premises WHERE id = ANY($1::bigint[])`, [ids]);
}

export type PremisesProposedOpportunityRow = OpportunityProposedPremises & {
  opportunity_client_name: string | null;
  opportunity_company_name: string | null;
  opportunity_contact_name: string | null;
  opportunity_district: string | null;
};

const opportunityJoin = `
  JOIN opportunities o ON o.id = opp.opportunity_id
  LEFT JOIN companies opp_co ON opp_co.id = o.company_id
  LEFT JOIN contacts opp_ct ON opp_ct.id = o.primary_contact_id`;

export async function listProposedPremisesForPremises(
  premisesId: string,
): Promise<PremisesProposedOpportunityRow[]> {
  return query<PremisesProposedOpportunityRow>(
    `SELECT ${select},
       o.client_name AS opportunity_client_name,
       o.district_preference AS opportunity_district,
       opp_co.company_name AS opportunity_company_name,
       opp_ct.contact_name AS opportunity_contact_name
     ${from}
     ${opportunityJoin}
     WHERE opp.premises_id = $1
     ORDER BY opp.tour_date DESC NULLS LAST, opp.id DESC`,
    [premisesId],
  );
}

export type PremisesFeeLineRow = {
  id: number;
  opportunity_id: number;
  opportunity_client_name: string | null;
  collect_fee_from_company_name: string | null;
  collect_fee_amount: string | null;
  collect_fee_status: FeeStatus | null;
  paid_out_to_company_name: string | null;
  paid_out_fee_amount: string | null;
  paid_out_status: FeeStatus | null;
  net_fee: number | null;
};

export type PremisesFeeSummary = {
  expected_collect: number;
  confirmed_collect: number;
  paid_out: number;
  net_fee: number;
  lines: PremisesFeeLineRow[];
};

function feeAmount(v: string | null | undefined): number {
  if (!v) return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export async function summarizePremisesFees(premisesId: string): Promise<PremisesFeeSummary> {
  const rows = await listProposedPremisesForPremises(premisesId);
  let expected_collect = 0;
  let confirmed_collect = 0;
  let paid_out = 0;
  const lines: PremisesFeeLineRow[] = [];

  for (const line of rows) {
    const collectAmt = feeAmount(line.collect_fee_amount);
    const paidAmt = feeAmount(line.paid_out_fee_amount);

    if (line.collect_fee_status === "expected") expected_collect += collectAmt;
    if (
      line.collect_fee_status === "confirmed" ||
      line.collect_fee_status === "invoiced" ||
      line.collect_fee_status === "paid"
    ) {
      confirmed_collect += collectAmt;
    }
    if (
      line.paid_out_status === "confirmed" ||
      line.paid_out_status === "invoiced" ||
      line.paid_out_status === "paid"
    ) {
      paid_out += paidAmt;
    }

    if (collectAmt > 0 || paidAmt > 0 || line.collect_fee_status || line.paid_out_status) {
      lines.push({
        id: line.id,
        opportunity_id: line.opportunity_id,
        opportunity_client_name: line.opportunity_client_name ?? null,
        collect_fee_from_company_name: line.collect_fee_from_company_name ?? null,
        collect_fee_amount: line.collect_fee_amount,
        collect_fee_status: line.collect_fee_status,
        paid_out_to_company_name: line.paid_out_to_company_name ?? null,
        paid_out_fee_amount: line.paid_out_fee_amount,
        paid_out_status: line.paid_out_status,
        net_fee: collectAmt - paidAmt,
      });
    }
  }

  return {
    expected_collect,
    confirmed_collect,
    paid_out,
    net_fee: confirmed_collect - paid_out,
    lines,
  };
}

export type OpportunityFeeSummary = {
  expected_collect: number;
  confirmed_collect: number;
  paid_out: number;
  net_fee: number;
  by_party: { company_id: number; company_name: string; collect: number; paid_out: number }[];
};

export async function summarizeOpportunityFees(opportunityId: number): Promise<OpportunityFeeSummary> {
  const lines = await listProposedPremisesForOpportunity(opportunityId);
  let expected_collect = 0;
  let confirmed_collect = 0;
  let paid_out = 0;
  const partyMap = new Map<number, { company_name: string; collect: number; paid_out: number }>();

  for (const line of lines) {
    const collectAmt = line.collect_fee_amount ? Number.parseFloat(line.collect_fee_amount) : 0;
    const paidAmt = line.paid_out_fee_amount ? Number.parseFloat(line.paid_out_fee_amount) : 0;

    if (line.collect_fee_status === "expected" && Number.isFinite(collectAmt)) {
      expected_collect += collectAmt;
    }
    if (
      (line.collect_fee_status === "confirmed" ||
        line.collect_fee_status === "invoiced" ||
        line.collect_fee_status === "paid") &&
      Number.isFinite(collectAmt)
    ) {
      confirmed_collect += collectAmt;
    }
    if (
      (line.paid_out_status === "confirmed" ||
        line.paid_out_status === "invoiced" ||
        line.paid_out_status === "paid") &&
      Number.isFinite(paidAmt)
    ) {
      paid_out += paidAmt;
    }

    if (line.collect_fee_from_company_id && Number.isFinite(collectAmt)) {
      const cur = partyMap.get(line.collect_fee_from_company_id) ?? {
        company_name: line.collect_fee_from_company_name ?? `Company #${line.collect_fee_from_company_id}`,
        collect: 0,
        paid_out: 0,
      };
      cur.collect += collectAmt;
      partyMap.set(line.collect_fee_from_company_id, cur);
    }
    if (line.paid_out_to_company_id && Number.isFinite(paidAmt)) {
      const cur = partyMap.get(line.paid_out_to_company_id) ?? {
        company_name: line.paid_out_to_company_name ?? `Company #${line.paid_out_to_company_id}`,
        collect: 0,
        paid_out: 0,
      };
      cur.paid_out += paidAmt;
      partyMap.set(line.paid_out_to_company_id, cur);
    }
  }

  return {
    expected_collect,
    confirmed_collect,
    paid_out,
    net_fee: confirmed_collect - paid_out,
    by_party: [...partyMap.entries()].map(([company_id, v]) => ({ company_id, ...v })),
  };
}
