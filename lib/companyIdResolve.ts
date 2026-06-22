/** V1 company IDs: COMP-YYYY-#### */
export { isV1CompanyRef as isV1CompanyId, V1_COMPANY_ID_RE } from "@/lib/entityRefGuards";
import { isV1CompanyRef, isLegacyNumericRef as isLegacyNumericCompanyId } from "@/lib/entityRefGuards";

export { isLegacyNumericCompanyId };

export type CompanyLookupMaps = {
  v1ByLegacyId: Map<number, string>;
  v1ByName: Map<string, string>;
  legacyByV1Id: Map<string, number>;
};

export function buildCompanyLookupMaps(
  legacy: { id: number; company_name: string }[],
  v1: { company_id: string; company_name_en: string | null; legacy_company_id: number | null }[],
): CompanyLookupMaps {
  const v1ByLegacyId = new Map<number, string>();
  const v1ByName = new Map<string, string>();
  const legacyByV1Id = new Map<string, number>();

  for (const row of v1) {
    if (row.legacy_company_id != null) {
      v1ByLegacyId.set(row.legacy_company_id, row.company_id);
      legacyByV1Id.set(row.company_id, row.legacy_company_id);
    }
    const name = row.company_name_en?.trim().toLowerCase();
    if (name) v1ByName.set(name, row.company_id);
  }

  for (const row of legacy) {
    const name = row.company_name.trim().toLowerCase();
    if (!v1ByName.has(name) && v1ByLegacyId.has(row.id)) {
      v1ByName.set(name, v1ByLegacyId.get(row.id)!);
    }
  }

  return { v1ByLegacyId, v1ByName, legacyByV1Id };
}

/**
 * Normalize a stored company reference to a v1 company_id (COMP-YYYY-####).
 * Returns null if unresolvable.
 */
export function resolveToV1CompanyId(
  raw: string | null | undefined,
  maps: CompanyLookupMaps,
): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (isV1CompanyRef(value)) return value;

  if (isLegacyNumericCompanyId(value)) {
    const legacyId = Number.parseInt(value, 10);
    return maps.v1ByLegacyId.get(legacyId) ?? null;
  }

  const byName = maps.v1ByName.get(value.toLowerCase());
  if (byName) return byName;

  return null;
}

export type CompanyResolveResult = {
  field: string;
  recordId: string;
  oldValue: string;
  matchedCompanyId: string | null;
  status: "ok" | "already_v1" | "unmatched" | "empty";
};
