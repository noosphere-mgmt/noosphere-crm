import { query } from "@/lib/db";
import {
  buildCompanyLookupMaps,
  resolveToV1CompanyId,
  type CompanyLookupMaps,
} from "@/lib/companyIdResolve";

export async function loadCompanyLookupMaps(): Promise<CompanyLookupMaps> {
  const [legacy, v1] = await Promise.all([
    query<{ id: number; company_name: string }>(
      `SELECT id::int AS id, company_name FROM companies ORDER BY id`,
    ),
    query<{ company_id: string; company_name_en: string | null; legacy_company_id: number | null }>(
      `SELECT company_id, company_name_en, legacy_company_id::int AS legacy_company_id
       FROM companies_v1 ORDER BY company_id`,
    ),
  ]);
  return buildCompanyLookupMaps(legacy, v1);
}

export async function resolveV1CompanyId(raw: string | null | undefined): Promise<string | null> {
  const maps = await loadCompanyLookupMaps();
  return resolveToV1CompanyId(raw, maps);
}

export async function getCompanyV1DisplayName(companyId: string | null | undefined): Promise<string> {
  const id = companyId?.trim();
  if (!id) return "—";

  const rows = await query<{ company_name_en: string | null }>(
    `SELECT company_name_en FROM companies_v1 WHERE company_id = $1`,
    [id],
  );
  if (rows[0]?.company_name_en?.trim()) return rows[0].company_name_en.trim();

  const maps = await loadCompanyLookupMaps();
  const resolved = resolveToV1CompanyId(id, maps);
  if (resolved && resolved !== id) {
    const resolvedRows = await query<{ company_name_en: string | null }>(
      `SELECT company_name_en FROM companies_v1 WHERE company_id = $1`,
      [resolved],
    );
    if (resolvedRows[0]?.company_name_en?.trim()) return resolvedRows[0].company_name_en.trim();
  }

  return id;
}

export async function getCompanyV1DisplayNames(
  ids: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.map((id) => id?.trim()).filter(Boolean))] as string[];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;

  const maps = await loadCompanyLookupMaps();
  const resolvedIds = new Set<string>();

  for (const raw of unique) {
    const resolved = resolveToV1CompanyId(raw, maps) ?? raw;
    resolvedIds.add(resolved);
    if (resolved !== raw) map.set(raw, resolved);
  }

  const rows = await query<{ company_id: string; company_name_en: string | null }>(
    `SELECT company_id, company_name_en FROM companies_v1 WHERE company_id = ANY($1::text[])`,
    [[...resolvedIds]],
  );

  const nameById = new Map(
    rows.map((r) => [r.company_id, r.company_name_en?.trim() || r.company_id]),
  );

  for (const raw of unique) {
    const resolved = resolveToV1CompanyId(raw, maps) ?? raw;
    const label = nameById.get(resolved) ?? resolved;
    map.set(raw, label);
  }

  return map;
}
