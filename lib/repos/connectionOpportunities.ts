import { query } from "@/lib/db";
import { OPEN_OPPORTUNITY_STATUS_SQL } from "@/lib/openOpportunityStatus";
import { OPPORTUNITY_PARTY_ROLE_LABELS } from "@/lib/opportunityValues";
import type { OpportunityLeadType, OpportunitySalesRole, OpportunityStatus } from "@/lib/types/entities";

export type LinkedOpportunityRow = {
  id: number;
  client_name: string;
  role_label: string;
  lead_type: OpportunityLeadType;
  sales_role: OpportunitySalesRole;
  status: OpportunityStatus;
  budget_max: string | null;
  budget_min: string | null;
  fee_note: string | null;
  updated_at: string;
  company_name: string | null;
  primary_contact_name: string | null;
};

function formatPartyRole(role: string | null): string | null {
  if (!role?.trim()) return null;
  return OPPORTUNITY_PARTY_ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

type MatchRow = {
  opportunity_id: number;
  match_kind: string;
  party_role: string | null;
  fee_note: string | null;
};

async function loadOpportunityDetails(
  ids: number[],
  roleById: Map<number, { role_label: string; fee_note: string | null }>,
): Promise<LinkedOpportunityRow[]> {
  if (ids.length === 0) return [];

  const rows = await query<LinkedOpportunityRow>(
    `SELECT o.id,
            o.client_name,
            o.lead_type,
            o.sales_role,
            o.status,
            o.budget_max::text AS budget_max,
            o.budget_min::text AS budget_min,
            o.updated_at::text AS updated_at,
            lc.company_name,
            pc.contact_name AS primary_contact_name
     FROM opportunities o
     LEFT JOIN companies lc ON lc.id = o.company_id
     LEFT JOIN contacts pc ON pc.id = o.primary_contact_id
     WHERE o.id = ANY($1::bigint[])
     ORDER BY o.updated_at DESC NULLS LAST, o.id DESC`,
    [ids],
  );

  return rows.map((row) => ({
    ...row,
    role_label: roleById.get(row.id)?.role_label ?? "—",
    fee_note: roleById.get(row.id)?.fee_note ?? null,
  }));
}

function pickRoleLabel(matchKind: string, partyRole: string | null, primaryLabel: string): string {
  if (matchKind === "party" && partyRole) {
    return formatPartyRole(partyRole) ?? partyRole;
  }
  return primaryLabel;
}

function mergeMatches(rows: MatchRow[], primaryLabel: string): Map<number, { role_label: string; fee_note: string | null }> {
  const map = new Map<number, { role_label: string; fee_note: string | null }>();
  for (const row of rows) {
    const existing = map.get(row.opportunity_id);
    const next = {
      role_label: pickRoleLabel(row.match_kind, row.party_role, primaryLabel),
      fee_note: row.fee_note,
    };
    if (!existing) {
      map.set(row.opportunity_id, next);
      continue;
    }
    if (row.match_kind === "party") {
      map.set(row.opportunity_id, {
        role_label: pickRoleLabel("party", row.party_role, primaryLabel),
        fee_note: row.fee_note ?? existing.fee_note,
      });
    }
  }
  return map;
}

export async function listLinkedOpportunitiesForCompany(companyId: number): Promise<LinkedOpportunityRow[]> {
  const matches = await query<MatchRow>(
    `SELECT opportunity_id, match_kind, party_role, fee_note FROM (
       SELECT o.id AS opportunity_id, 'primary'::text AS match_kind, NULL::text AS party_role, NULL::text AS fee_note
       FROM opportunities o
       WHERE o.company_id = $1
       UNION ALL
       SELECT o.id, 'party', op.role, op.fee_note
       FROM opportunity_parties op
       JOIN opportunities o ON o.id = op.opportunity_id
       WHERE op.company_id = $1
     ) x
     ORDER BY opportunity_id, CASE match_kind WHEN 'party' THEN 0 ELSE 1 END`,
    [companyId],
  );

  const roleById = mergeMatches(matches, "Primary company");
  return loadOpportunityDetails([...roleById.keys()], roleById);
}

export async function listLinkedOpportunitiesForContact(contactId: number): Promise<LinkedOpportunityRow[]> {
  const matches = await query<MatchRow>(
    `SELECT opportunity_id, match_kind, party_role, fee_note FROM (
       SELECT o.id AS opportunity_id, 'primary'::text AS match_kind, NULL::text AS party_role, NULL::text AS fee_note
       FROM opportunities o
       WHERE o.primary_contact_id = $1
       UNION ALL
       SELECT o.id, 'party', op.role, op.fee_note
       FROM opportunity_parties op
       JOIN opportunities o ON o.id = op.opportunity_id
       WHERE op.contact_id = $1
     ) x
     ORDER BY opportunity_id, CASE match_kind WHEN 'party' THEN 0 ELSE 1 END`,
    [contactId],
  );

  const roleById = mergeMatches(matches, "Primary contact");
  return loadOpportunityDetails([...roleById.keys()], roleById);
}

export async function countOpenLinkedOpportunitiesForCompany(companyId: number): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT COUNT(DISTINCT o.id)::int AS n
     FROM opportunities o
     LEFT JOIN opportunity_parties op ON op.opportunity_id = o.id AND op.company_id = $1
     WHERE (o.company_id = $1 OR op.company_id = $1)
       AND o.status NOT IN ${OPEN_OPPORTUNITY_STATUS_SQL}`,
    [companyId],
  );
  return rows[0]?.n ?? 0;
}

export async function countOpenLinkedOpportunitiesForContact(contactId: number): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT COUNT(DISTINCT o.id)::int AS n
     FROM opportunities o
     LEFT JOIN opportunity_parties op ON op.opportunity_id = o.id AND op.contact_id = $1
     WHERE (o.primary_contact_id = $1 OR op.contact_id = $1)
       AND o.status NOT IN ${OPEN_OPPORTUNITY_STATUS_SQL}`,
    [contactId],
  );
  return rows[0]?.n ?? 0;
}
