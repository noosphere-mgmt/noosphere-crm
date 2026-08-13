import { query } from "@/lib/db";
import { buildingWorkspaceHref } from "@/lib/buildingWorkspaceNav";
import { formatPremisesName } from "@/lib/premisesDisplay";
import { premisesWorkspaceHref } from "@/lib/premisesWorkspaceNav";

export type CompanyLinkedPropertyRow = {
  kind: "premise" | "building";
  id: string;
  business_id: string | null;
  label: string;
  building_name: string | null;
  roles: string[];
  href: string;
};

/** All known string refs that may appear on premises/buildings company FKs or relationship lines. */
async function resolveCompanyMatchRefs(legacyCompanyId: number): Promise<string[]> {
  const rows = await query<{
    legacy_id: string;
    company_business_id: string | null;
    v1_company_id: string | null;
    v1_business_id: string | null;
    map_new_id: string | null;
  }>(
    `SELECT
       c.id::text AS legacy_id,
       NULLIF(TRIM(c.business_id), '') AS company_business_id,
       NULLIF(TRIM(cv.company_id), '') AS v1_company_id,
       NULLIF(TRIM(cv.business_id), '') AS v1_business_id,
       NULLIF(TRIM(m.new_id), '') AS map_new_id
     FROM companies c
     LEFT JOIN companies_v1 cv ON cv.legacy_company_id = c.id
     LEFT JOIN id_map_v1 m ON m.entity_type = 'company' AND m.legacy_id = c.id
     WHERE c.id = $1
     LIMIT 1`,
    [legacyCompanyId],
  );
  const row = rows[0];
  if (!row) return [String(legacyCompanyId)];
  const refs = [
    row.legacy_id,
    row.company_business_id,
    row.v1_company_id,
    row.v1_business_id,
    row.map_new_id,
  ].filter((v): v is string => Boolean(v));
  return [...new Set(refs)];
}

function rolesFromFlags(flags: {
  operator?: boolean;
  owner?: boolean;
  landlord?: boolean;
  tenant?: boolean;
  source?: boolean;
  management?: boolean;
  line_roles?: string[] | null;
}): string[] {
  const roles: string[] = [];
  if (flags.operator) roles.push("Operator");
  if (flags.owner) roles.push("Owner");
  if (flags.landlord) roles.push("Landlord");
  if (flags.management) roles.push("Building management");
  if (flags.tenant) roles.push("Tenant");
  if (flags.source) roles.push("Source");
  for (const role of flags.line_roles ?? []) {
    const trimmed = role.trim();
    if (trimmed && !roles.includes(trimmed)) roles.push(trimmed);
  }
  return roles;
}

export async function listCompanyLinkedProperties(
  legacyCompanyId: number,
): Promise<CompanyLinkedPropertyRow[]> {
  const refs = await resolveCompanyMatchRefs(legacyCompanyId);
  if (refs.length === 0) return [];

  const [premises, buildings] = await Promise.all([
    query<{
      premises_id: string;
      business_id: string | null;
      property_name_en: string | null;
      floor: string | null;
      unit: string | null;
      building_name: string | null;
      building_business_id: string | null;
      property_id: string;
      is_operator: boolean;
      is_owner: boolean;
      is_landlord: boolean;
      is_tenant: boolean;
      is_source: boolean;
      line_roles: string[] | null;
    }>(
      `SELECT
         p.premises_id,
         p.business_id,
         p.property_name_en,
         p.floor,
         p.unit,
         pr.bldg_name_en AS building_name,
         pr.business_id AS building_business_id,
         p.property_id,
         (NULLIF(TRIM(p.operator_company_id), '') = ANY($1::text[])) AS is_operator,
         (NULLIF(TRIM(p.owner_company_id), '') = ANY($1::text[])) AS is_owner,
         (NULLIF(TRIM(p.landlord_company_id), '') = ANY($1::text[])) AS is_landlord,
         (NULLIF(TRIM(p.current_tenant_company_id), '') = ANY($1::text[])) AS is_tenant,
         (NULLIF(TRIM(p.source_company_id), '') = ANY($1::text[])) AS is_source,
         (
           SELECT ARRAY_AGG(DISTINCT NULLIF(TRIM(line->>'relationship_type'), ''))
           FILTER (WHERE NULLIF(TRIM(line->>'company_id'), '') = ANY($1::text[]))
           FROM jsonb_array_elements(COALESCE(p.relationship_lines::jsonb, '[]'::jsonb)) AS line
         ) AS line_roles
       FROM premises_v1 p
       LEFT JOIN properties_v1 pr ON pr.property_id = p.property_id
       WHERE NULLIF(TRIM(p.operator_company_id), '') = ANY($1::text[])
          OR NULLIF(TRIM(p.owner_company_id), '') = ANY($1::text[])
          OR NULLIF(TRIM(p.landlord_company_id), '') = ANY($1::text[])
          OR NULLIF(TRIM(p.current_tenant_company_id), '') = ANY($1::text[])
          OR NULLIF(TRIM(p.source_company_id), '') = ANY($1::text[])
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(p.relationship_lines::jsonb, '[]'::jsonb)) AS line
            WHERE NULLIF(TRIM(line->>'company_id'), '') = ANY($1::text[])
          )
       ORDER BY pr.bldg_name_en ASC NULLS LAST, p.floor ASC NULLS LAST, p.unit ASC NULLS LAST, p.premises_id ASC`,
      [refs],
    ),
    query<{
      property_id: string;
      business_id: string | null;
      bldg_name_en: string | null;
      is_operator: boolean;
      is_owner: boolean;
      is_tenant: boolean;
      is_management: boolean;
      line_roles: string[] | null;
    }>(
      `SELECT
         pr.property_id,
         pr.business_id,
         pr.bldg_name_en,
         (NULLIF(TRIM(pr.operator_company_id), '') = ANY($1::text[])) AS is_operator,
         (NULLIF(TRIM(pr.owner_company_id), '') = ANY($1::text[])) AS is_owner,
         (NULLIF(TRIM(pr.current_tenant_company_id), '') = ANY($1::text[])) AS is_tenant,
         (NULLIF(TRIM(pr.management_company_id), '') = ANY($1::text[])) AS is_management,
         (
           SELECT ARRAY_AGG(DISTINCT NULLIF(TRIM(line->>'role'), ''))
           FILTER (WHERE NULLIF(TRIM(line->>'company_id'), '') = ANY($1::text[]))
           FROM jsonb_array_elements(COALESCE(pr.building_relationship_lines::jsonb, '[]'::jsonb)) AS line
         ) AS line_roles
       FROM properties_v1 pr
       WHERE NULLIF(TRIM(pr.operator_company_id), '') = ANY($1::text[])
          OR NULLIF(TRIM(pr.owner_company_id), '') = ANY($1::text[])
          OR NULLIF(TRIM(pr.current_tenant_company_id), '') = ANY($1::text[])
          OR NULLIF(TRIM(pr.management_company_id), '') = ANY($1::text[])
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(pr.building_relationship_lines::jsonb, '[]'::jsonb)) AS line
            WHERE NULLIF(TRIM(line->>'company_id'), '') = ANY($1::text[])
          )
       ORDER BY pr.bldg_name_en ASC NULLS LAST, pr.property_id ASC`,
      [refs],
    ),
  ]);

  const premiseRows: CompanyLinkedPropertyRow[] = premises.map((row) => {
    const ref = { premises_id: row.premises_id, business_id: row.business_id };
    return {
      kind: "premise",
      id: row.premises_id,
      business_id: row.business_id,
      label:
        row.property_name_en?.trim() ||
        formatPremisesName(row.building_name, row.floor, row.unit),
      building_name: row.building_name,
      roles: rolesFromFlags({
        operator: row.is_operator,
        owner: row.is_owner,
        landlord: row.is_landlord,
        tenant: row.is_tenant,
        source: row.is_source,
        line_roles: row.line_roles,
      }),
      href: premisesWorkspaceHref(ref, "overview"),
    };
  });

  // Avoid duplicating buildings that already appear via linked premises — still show
  // buildings that are related only at building level.
  const buildingsCoveredByPremises = new Set(
    premises.map((p) => p.property_id).filter(Boolean),
  );

  const buildingRows: CompanyLinkedPropertyRow[] = buildings
    .filter((row) => !buildingsCoveredByPremises.has(row.property_id))
    .map((row) => {
      const ref = { property_id: row.property_id, business_id: row.business_id };
      return {
        kind: "building",
        id: row.property_id,
        business_id: row.business_id,
        label: row.bldg_name_en?.trim() || row.property_id,
        building_name: row.bldg_name_en,
        roles: rolesFromFlags({
          operator: row.is_operator,
          owner: row.is_owner,
          tenant: row.is_tenant,
          management: row.is_management,
          line_roles: row.line_roles,
        }),
        href: buildingWorkspaceHref(ref, "overview"),
      };
    });

  return [...premiseRows, ...buildingRows];
}
