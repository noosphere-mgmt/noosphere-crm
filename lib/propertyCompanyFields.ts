import { loadCompanyLookupMaps } from "@/lib/companyV1Resolve";
import { resolveToV1CompanyId } from "@/lib/companyIdResolve";
import { normalizeOptionalV1CompanyId, normalizeOptionalV1ContactId } from "@/lib/crmRefResolve";

/** Normalize any company ref for properties_v1 / premises_v1 TEXT FK columns (COMP-*). */
export async function normalizePropertyV1CompanyIdForDb(raw: unknown): Promise<string | null> {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;

  const maps = await loadCompanyLookupMaps();
  const fromMaps = resolveToV1CompanyId(s, maps);
  if (fromMaps) return fromMaps;

  return normalizeOptionalV1CompanyId(s);
}

/** Normalize contact ref for premises_v1 TEXT source_contact_id (CONT-*). */
export async function normalizePremisesV1ContactIdForDb(raw: unknown): Promise<string | null> {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;

  return normalizeOptionalV1ContactId(s);
}

export async function normalizePropertyV1CompanyPatch<T extends Record<string, unknown>>(
  patch: T,
  fields: readonly string[],
): Promise<T> {
  const out = { ...patch };
  for (const field of fields) {
    if (!(field in out)) continue;
    const key = field as keyof T;
    out[key] = (await normalizePropertyV1CompanyIdForDb(out[key])) as T[keyof T];
  }
  return out;
}
