import { query } from "@/lib/db";
import { countOpenLinkedOpportunitiesForCompany } from "@/lib/repos/connectionOpportunities";

export type CompanyCrmSummary = {
  contacts: number;
  properties: number;
  premises: number;
  openOpportunities: number;
};

async function getV1CompanyId(legacyCompanyId: number): Promise<string | null> {
  const rows = await query<{ new_id: string }>(
    `SELECT new_id FROM id_map_v1 WHERE entity_type = 'company' AND legacy_id = $1`,
    [legacyCompanyId],
  );
  return rows[0]?.new_id ?? null;
}

async function countV1Properties(v1CompanyId: string): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT COUNT(DISTINCT property_id)::int AS n FROM properties_v1
     WHERE management_company_id = $1
        OR operator_company_id = $1
        OR owner_company_id = $1
        OR current_tenant_company_id = $1`,
    [v1CompanyId],
  );
  return rows[0]?.n ?? 0;
}

async function countV1Premises(v1CompanyId: string): Promise<number> {
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

export async function getCompanyCrmSummary(legacyCompanyId: number): Promise<CompanyCrmSummary> {
  const [contactRows, openOpportunities, v1CompanyId] = await Promise.all([
    query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM contacts WHERE company_id = $1 AND is_active = TRUE`,
      [legacyCompanyId],
    ),
    countOpenLinkedOpportunitiesForCompany(legacyCompanyId),
    getV1CompanyId(legacyCompanyId),
  ]);

  let properties = 0;
  let premises = 0;
  if (v1CompanyId) {
    [properties, premises] = await Promise.all([
      countV1Properties(v1CompanyId),
      countV1Premises(v1CompanyId),
    ]);
  }

  return {
    contacts: contactRows[0]?.n ?? 0,
    properties,
    premises,
    openOpportunities: openOpportunities,
  };
}
