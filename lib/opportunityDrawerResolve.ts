import { query } from "@/lib/db";
import { resolveOpportunityRefToLegacy } from "@/lib/crmRefResolve";

const V1_OPPORTUNITY_ID_RE = /^OPP-\d{4}-\d{4}$/;

export function isV1OpportunityId(value: string | null | undefined): boolean {
  return V1_OPPORTUNITY_ID_RE.test(value?.trim() ?? "");
}

/** Resolve ?opportunity= query param (or full-page path id) to legacy opportunities.id. */
export async function resolveOpportunityQueryParam(
  raw: string | undefined,
): Promise<number | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  // Permanent business ID (M100001), OPP-*, numeric, or other known refs.
  return resolveOpportunityRefToLegacy(trimmed);
}

export async function lookupV1OpportunityId(legacyOpportunityId: number): Promise<string | null> {
  const rows = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'opportunity' AND legacy_id = $1`,
    [legacyOpportunityId],
  );
  return rows[0]?.new_id ?? null;
}
