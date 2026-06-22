import { query } from "@/lib/db";
import { sqlMatchMixedCompanyFk } from "@/lib/import/lookupSql";
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

async function countV1Properties(v1CompanyId: string, legacyCompanyId: number): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT COUNT(DISTINCT property_id)::int AS n FROM properties_v1
     WHERE ${sqlMatchMixedCompanyFk("management_company_id", "$1", "$2")}
        OR ${sqlMatchMixedCompanyFk("operator_company_id", "$1", "$2")}
        OR ${sqlMatchMixedCompanyFk("owner_company_id", "$1", "$2")}
        OR ${sqlMatchMixedCompanyFk("current_tenant_company_id", "$1", "$2")}`,
    [v1CompanyId, String(legacyCompanyId)],
  );
  return rows[0]?.n ?? 0;
}

async function countV1Premises(v1CompanyId: string, legacyCompanyId: number): Promise<number> {
  const rows = await query<{ n: number }>(
    `SELECT COUNT(DISTINCT p.premises_id)::int AS n
     FROM premises_v1 p
     LEFT JOIN LATERAL jsonb_array_elements(COALESCE(p.relationship_lines::jsonb, '[]'::jsonb)) AS line ON true
     WHERE ${sqlMatchMixedCompanyFk("p.operator_company_id", "$1", "$2")}
        OR ${sqlMatchMixedCompanyFk("p.owner_company_id", "$1", "$2")}
        OR ${sqlMatchMixedCompanyFk("p.landlord_company_id", "$1", "$2")}
        OR ${sqlMatchMixedCompanyFk("p.current_tenant_company_id", "$1", "$2")}
        OR ${sqlMatchMixedCompanyFk("p.source_company_id", "$1", "$2")}
        OR line->>'company_id' IN ($1, $2)`,
    [v1CompanyId, String(legacyCompanyId)],
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
      countV1Properties(v1CompanyId, legacyCompanyId),
      countV1Premises(v1CompanyId, legacyCompanyId),
    ]);
  } else {
    [properties, premises] = await Promise.all([
      countV1Properties(String(legacyCompanyId), legacyCompanyId),
      countV1Premises(String(legacyCompanyId), legacyCompanyId),
    ]);
  }

  return {
    contacts: contactRows[0]?.n ?? 0,
    properties,
    premises,
    openOpportunities: openOpportunities,
  };
}
