import { query } from "@/lib/db";

export type CompanyReferenceItem = {
  module: string;
  count: number;
  label: string;
};

export type CompanyReferenceSummary = {
  companyId: number;
  companyName: string;
  v1CompanyId: string | null;
  total: number;
  items: CompanyReferenceItem[];
};

async function getV1CompanyIdForLegacy(legacyId: number): Promise<string | null> {
  const rows = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'company' AND legacy_id = $1`,
    [legacyId],
  );
  return rows[0]?.new_id ?? null;
}

async function countPremisesV1References(v1CompanyId: string): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT COUNT(DISTINCT p.premises_id)::int AS n
     FROM premises_v1 p
     LEFT JOIN LATERAL jsonb_array_elements(COALESCE(p.relationship_lines, '[]'::jsonb)) AS line ON true
     WHERE p.operator_company_id = $1
        OR p.owner_company_id = $1
        OR p.landlord_company_id = $1
        OR p.current_tenant_company_id = $1
        OR p.source_company_id = $1
        OR line->>'company_id' = $1`,
    [v1CompanyId],
  );
  return rows[0]?.n ?? 0;
}

async function countPropertiesV1References(v1CompanyId: string): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM properties_v1
     WHERE management_company_id = $1
        OR operator_company_id = $1
        OR owner_company_id = $1
        OR current_tenant_company_id = $1`,
    [v1CompanyId],
  );
  return rows[0]?.n ?? 0;
}

export async function getCompanyReferenceSummary(legacyId: number): Promise<CompanyReferenceSummary | null> {
  const companyRows = await query<{ company_name: string }>(
    `SELECT company_name FROM companies WHERE id = $1`,
    [legacyId],
  );
  if (!companyRows[0]) return null;

  const v1CompanyId = await getV1CompanyIdForLegacy(legacyId);
  const items: CompanyReferenceItem[] = [];

  const push = async (module: string, label: string, sql: string, params: unknown[]) => {
    const rows = await query<{ n: number }>(sql, params);
    const count = rows[0]?.n ?? 0;
    if (count > 0) items.push({ module, count, label });
  };

  await push(
    "contacts",
    "Contacts",
    `SELECT COUNT(*)::int AS n FROM contacts WHERE company_id = $1`,
    [legacyId],
  );
  await push(
    "opportunities",
    "Opportunities (client)",
    `SELECT COUNT(*)::int AS n FROM opportunities WHERE company_id = $1`,
    [legacyId],
  );
  await push(
    "opportunities_referrer",
    "Opportunities (referrer)",
    `SELECT COUNT(*)::int AS n FROM opportunities WHERE referrer_company_id = $1`,
    [legacyId],
  );
  await push(
    "assets",
    "Assets / spaces",
    `SELECT COUNT(*)::int AS n FROM assets
     WHERE operator_company_id = $1 OR landlord_company_id = $1 OR current_tenant_company_id = $1`,
    [legacyId],
  );
  await push(
    "properties",
    "Marketable properties",
    `SELECT COUNT(*)::int AS n FROM properties
     WHERE operator_company_id = $1 OR landlord_company_id = $1 OR current_tenant_company_id = $1`,
    [legacyId],
  );
  await push(
    "activities",
    "Activities",
    `SELECT COUNT(*)::int AS n FROM activities WHERE company_id = $1`,
    [legacyId],
  );

  if (v1CompanyId) {
    const premisesCount = await countPremisesV1References(v1CompanyId);
    if (premisesCount > 0) {
      items.push({ module: "premises_v1", count: premisesCount, label: "Premises" });
    }
    const propertiesCount = await countPropertiesV1References(v1CompanyId);
    if (propertiesCount > 0) {
      items.push({ module: "properties_v1", count: propertiesCount, label: "Buildings (v1)" });
    }
  }

  const total = items.reduce((sum, i) => sum + i.count, 0);

  return {
    companyId: legacyId,
    companyName: companyRows[0].company_name,
    v1CompanyId,
    total,
    items,
  };
}

export async function assertCompanyDeletable(legacyId: number): Promise<void> {
  const summary = await getCompanyReferenceSummary(legacyId);
  if (!summary) throw new Error("Company not found");
  if (summary.total > 0) {
    throw new Error(
      `This company is referenced by ${summary.total} record(s). Remove or reassign links before deleting.`,
    );
  }
}
