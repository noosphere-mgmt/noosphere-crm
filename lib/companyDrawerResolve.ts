import { query } from "@/lib/db";
import {
  classifyCompanyQueryParam,
  isV1CompanyRef,
} from "@/lib/entityRefGuards";

export type CompanyQueryResolveResult =
  | { kind: "company"; legacyCompanyId: number }
  | { kind: "contact_mismatch"; contactQuery: string; redirectToContact: string };

export { isV1CompanyRef as isV1CompanyId } from "@/lib/entityRefGuards";

/** Resolve ?company= query param to legacy companies.id (bigint PK). */
export async function resolveLegacyCompanyIdFromQuery(
  raw: string | undefined,
): Promise<number | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const classified = classifyCompanyQueryParam(trimmed);
  if (classified?.kind === "company") {
    return classified.legacyCompanyId;
  }

  if (isV1CompanyRef(trimmed)) {
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

/** Resolve ?company= with cross-entity redirect support. */
export async function resolveCompanyQueryParam(
  raw: string | undefined,
): Promise<CompanyQueryResolveResult | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const classified = classifyCompanyQueryParam(trimmed);
  if (classified?.kind === "contact_mismatch") {
    return classified;
  }
  if (classified?.kind === "company") {
    return classified;
  }

  const legacyCompanyId = await resolveLegacyCompanyIdFromQuery(trimmed);
  if (legacyCompanyId != null) {
    return { kind: "company", legacyCompanyId };
  }

  return null;
}

export async function lookupV1CompanyId(legacyCompanyId: number): Promise<string | null> {
  const fromV1 = await query<{ company_id: string }>(
    `SELECT company_id FROM companies_v1 WHERE legacy_company_id = $1 LIMIT 1`,
    [legacyCompanyId],
  );
  if (fromV1[0]?.company_id) return fromV1[0].company_id;

  const rows = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'company' AND legacy_id = $1`,
    [legacyCompanyId],
  );
  return rows[0]?.new_id ?? null;
}
