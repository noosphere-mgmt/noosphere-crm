import { query } from "@/lib/db";

const V1_OPPORTUNITY_ID_RE = /^OPP-\d{4}-\d{4}$/;

export function isV1OpportunityId(value: string | null | undefined): boolean {
  return V1_OPPORTUNITY_ID_RE.test(value?.trim() ?? "");
}

/** Resolve ?opportunity= query param to legacy opportunities.id (bigint PK). */
export async function resolveOpportunityQueryParam(
  raw: string | undefined,
): Promise<number | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const id = Number.parseInt(trimmed, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  if (isV1OpportunityId(trimmed)) {
    const fromV1 = await query<{ legacy_opportunity_id: number }>(
      `SELECT legacy_opportunity_id::int AS legacy_opportunity_id
       FROM opportunities_v1 WHERE opportunity_id = $1`,
      [trimmed],
    );
    if (fromV1[0]?.legacy_opportunity_id) return fromV1[0].legacy_opportunity_id;

    const fromMap = await query<{ legacy_id: number }>(
      `SELECT legacy_id::int AS legacy_id
       FROM id_map_v1 WHERE entity_type = 'opportunity' AND new_id = $1`,
      [trimmed],
    );
    if (fromMap[0]?.legacy_id) return fromMap[0].legacy_id;
  }

  return null;
}

export async function lookupV1OpportunityId(legacyOpportunityId: number): Promise<string | null> {
  const rows = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'opportunity' AND legacy_id = $1`,
    [legacyOpportunityId],
  );
  return rows[0]?.new_id ?? null;
}
