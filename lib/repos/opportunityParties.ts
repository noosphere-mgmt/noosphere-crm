import { query } from "@/lib/db";
import type { FeeStatus, OpportunityParty } from "@/lib/types/entities";

const select = `
  op.id,
  op.opportunity_id,
  op.company_id,
  op.contact_id,
  op.role,
  op.partnership_mode,
  op.fee_note,
  op.collect_fee_amount::text,
  op.collect_fee_percent::text,
  op.paid_out_fee_amount::text,
  op.paid_out_fee_percent::text,
  op.collect_fee_status,
  op.remarks,
  op.created_at::text,
  op.updated_at::text,
  c.company_name,
  ct.contact_name
`;

const from = `
  FROM opportunity_parties op
  JOIN companies c ON c.id = op.company_id
  LEFT JOIN contacts ct ON ct.id = op.contact_id
`;

export type OpportunityPartyInput = {
  company_id: number;
  contact_id?: number | null;
  role: string;
  partnership_mode?: string | null;
  collect_fee_amount?: number | null;
  collect_fee_percent?: number | null;
  paid_out_fee_amount?: number | null;
  paid_out_fee_percent?: number | null;
  collect_fee_status?: FeeStatus | null;
  remarks?: string | null;
};

function partyValues(input: OpportunityPartyInput) {
  return [
    input.company_id,
    input.contact_id ?? null,
    input.role.trim(),
    input.partnership_mode?.trim() || null,
    input.collect_fee_amount ?? null,
    input.collect_fee_percent ?? null,
    input.paid_out_fee_amount ?? null,
    input.paid_out_fee_percent ?? null,
    input.collect_fee_status ?? "expected",
    input.remarks?.trim() || null,
  ];
}

export async function listOpportunityParties(opportunityId: number): Promise<OpportunityParty[]> {
  return query<OpportunityParty>(
    `SELECT ${select} ${from}
     WHERE op.opportunity_id = $1
     ORDER BY op.id ASC`,
    [opportunityId],
  );
}

export async function createOpportunityParty(
  opportunityId: number,
  input: OpportunityPartyInput,
): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO opportunity_parties (
       opportunity_id, company_id, contact_id, role, partnership_mode,
       collect_fee_amount, collect_fee_percent, paid_out_fee_amount, paid_out_fee_percent,
       collect_fee_status, remarks
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id::text AS id`,
    [opportunityId, ...partyValues(input)],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateOpportunityParty(id: number, input: OpportunityPartyInput): Promise<void> {
  await query(
    `UPDATE opportunity_parties SET
       company_id = $2, contact_id = $3, role = $4, partnership_mode = $5,
       collect_fee_amount = $6, collect_fee_percent = $7,
       paid_out_fee_amount = $8, paid_out_fee_percent = $9,
       collect_fee_status = $10, remarks = $11
     WHERE id = $1`,
    [id, ...partyValues(input)],
  );
}

export async function deleteOpportunityParty(id: number): Promise<void> {
  await query(`DELETE FROM opportunity_parties WHERE id = $1`, [id]);
}
