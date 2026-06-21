import { query } from "@/lib/db";
import { isV1CompanyId } from "@/lib/companyIdResolve";

/** Resolve ?company= query param to legacy companies.id (bigint PK). */
export async function resolveLegacyCompanyIdFromQuery(
  raw: string | undefined,
): Promise<number | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const id = Number.parseInt(trimmed, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  if (isV1CompanyId(trimmed)) {
    const fromV1 = await query<{ legacy_company_id: number }>(
      `SELECT legacy_company_id::int AS legacy_company_id
       FROM companies_v1 WHERE company_id = $1`,
      [trimmed],
    );
    if (fromV1[0]?.legacy_company_id) return fromV1[0].legacy_company_id;

    const fromMap = await query<{ legacy_id: number }>(
      `SELECT legacy_id::int AS legacy_id
       FROM id_map_v1 WHERE entity_type = 'company' AND new_id = $1`,
      [trimmed],
    );
    if (fromMap[0]?.legacy_id) return fromMap[0].legacy_id;
  }

  return null;
}

export async function lookupV1CompanyId(legacyCompanyId: number): Promise<string | null> {
  const rows = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'company' AND legacy_id = $1`,
    [legacyCompanyId],
  );
  return rows[0]?.new_id ?? null;
}
