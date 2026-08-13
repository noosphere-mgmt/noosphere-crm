import { query } from "@/lib/db";
import { sqlJoinV1Company } from "@/lib/import/lookupSql";
import {
  coercePropertyV1PatchForDb,
  describePropertyV1UpdateParams,
  formatSqlParamDebug,
} from "@/lib/propertyV1DbCoerce";
import { allocateNextBusinessId, registerBusinessId } from "@/lib/businessIdResolve";
import { normalizeBuildingRelationships, type BuildingRelationshipLine } from "@/lib/buildingRelationships";

export type PropertyV1 = {
  property_id: string;
  business_id?: string | null;
  bldg_name_en: string | null;
  bldg_name_zh: string | null;
  bldg_name_cn: string | null;
  building_type: string | null;
  tower_block: string | null;
  floor_count: number | null;
  bldg_area_sqft: string | null;
  bldg_area_sqm: string | null;
  year_built: number | null;
  bldg_desc: string | null;
  bldg_desc_zh: string | null;
  bldg_desc_cn: string | null;
  location_advantages_en: string | null;
  location_advantages_zh: string | null;
  location_advantages_cn: string | null;
  proposal_highlights_en: string | null;
  proposal_highlights_zh: string | null;
  proposal_highlights_cn: string | null;
  building_remarks: string | null;
  land_use: string | null;
  class_of_site: string | null;
  land_tenure: string | null;
  plot_ratio: string | null;
  site_area_sqft: string | null;
  site_area_sqm: string | null;
  country: string | null;
  city_en: string | null;
  city_zh: string | null;
  city_cn: string | null;
  district_en: string | null;
  district_zh: string | null;
  district_cn: string | null;
  street_no: string | null;
  street_name_en: string | null;
  street_name_zh: string | null;
  street_name_cn: string | null;
  full_address_en: string | null;
  full_address_zh: string | null;
  full_address_cn: string | null;
  mtr_station: string | null;
  walking_minutes: number | null;
  facilities: string | null;
  facilities_zh: string | null;
  facilities_cn: string | null;
  green_certification: string | null;
  lot_number: string | null;
  grade: string | null;
  management_company_id: string | null;
  operator_company_id: string | null;
  current_tenant_company_id: string | null;
  owner_company_id: string | null;
  title: string | null;
  inventory_count: number | null;
  inventory_count_sales: number | null;
  inventory_count_lease: number | null;
  building_relationship_lines: BuildingRelationshipLine[];
  updated_at: string;
};

const select = `
  property_id,
  business_id,
  bldg_name_en, bldg_name_zh, bldg_name_cn, building_type,
  tower_block, floor_count,
  bldg_area_sqft::text AS bldg_area_sqft,
  bldg_area_sqm::text AS bldg_area_sqm,
  year_built,
  bldg_desc,
  bldg_desc_zh, bldg_desc_cn,
  location_advantages_en, location_advantages_zh, location_advantages_cn,
  proposal_highlights_en, proposal_highlights_zh, proposal_highlights_cn,
  building_remarks,
  land_use, class_of_site, land_tenure,
  plot_ratio::text AS plot_ratio,
  site_area_sqft::text AS site_area_sqft,
  site_area_sqm::text AS site_area_sqm,
  country, city_en, city_zh, city_cn,
  district_en, district_zh, district_cn,
  street_no, street_name_en, street_name_zh, street_name_cn,
  full_address_en, full_address_zh, full_address_cn,
  mtr_station, walking_minutes, facilities, facilities_zh, facilities_cn, green_certification, lot_number,
  grade, management_company_id, operator_company_id, current_tenant_company_id, owner_company_id, title,
  inventory_count, inventory_count_sales, inventory_count_lease,
  building_relationship_lines,
  updated_at::text AS updated_at
`;

export type PropertiesListFilters = {
  q?: string;
  category?: string;
  title?: string;
  related_company?: string;
};

export async function listPropertiesV1(filters: PropertiesListFilters = {}): Promise<PropertyV1[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.q) {
    const qParam = `$${params.length + 1}`;
    clauses.push(`(
      property_id ILIKE ${qParam}
      OR business_id ILIKE ${qParam}
      OR bldg_name_en ILIKE ${qParam}
      OR bldg_name_zh ILIKE ${qParam}
      OR bldg_name_cn ILIKE ${qParam}
      OR tower_block ILIKE ${qParam}
      OR building_type ILIKE ${qParam}
      OR title ILIKE ${qParam}
      OR grade ILIKE ${qParam}
      OR country ILIKE ${qParam}
      OR city_en ILIKE ${qParam}
      OR city_zh ILIKE ${qParam}
      OR city_cn ILIKE ${qParam}
      OR district_en ILIKE ${qParam}
      OR district_zh ILIKE ${qParam}
      OR district_cn ILIKE ${qParam}
      OR street_no ILIKE ${qParam}
      OR street_name_en ILIKE ${qParam}
      OR street_name_zh ILIKE ${qParam}
      OR street_name_cn ILIKE ${qParam}
      OR full_address_en ILIKE ${qParam}
      OR full_address_zh ILIKE ${qParam}
      OR full_address_cn ILIKE ${qParam}
      OR mtr_station ILIKE ${qParam}
      OR facilities ILIKE ${qParam}
      OR facilities_zh ILIKE ${qParam}
      OR facilities_cn ILIKE ${qParam}
      OR green_certification ILIKE ${qParam}
      OR lot_number ILIKE ${qParam}
      OR bldg_desc ILIKE ${qParam}
      OR bldg_desc_zh ILIKE ${qParam}
      OR bldg_desc_cn ILIKE ${qParam}
      OR location_advantages_en ILIKE ${qParam}
      OR location_advantages_zh ILIKE ${qParam}
      OR location_advantages_cn ILIKE ${qParam}
      OR proposal_highlights_en ILIKE ${qParam}
      OR proposal_highlights_zh ILIKE ${qParam}
      OR proposal_highlights_cn ILIKE ${qParam}
      OR building_remarks ILIKE ${qParam}
      OR EXISTS (
        SELECT 1 FROM companies_v1 co
        WHERE (
          ${sqlJoinV1Company("co", "properties_v1.operator_company_id")}
          OR ${sqlJoinV1Company("co", "properties_v1.owner_company_id")}
          OR ${sqlJoinV1Company("co", "properties_v1.management_company_id")}
          OR ${sqlJoinV1Company("co", "properties_v1.current_tenant_company_id")}
        )
          AND (
            co.company_name_en ILIKE ${qParam}
            OR co.company_name_zh ILIKE ${qParam}
            OR co.business_id ILIKE ${qParam}
          )
      )
    )`);
    params.push(`%${filters.q}%`);
  }
  if (filters.category) {
    clauses.push(`building_type = $${params.length + 1}`);
    params.push(filters.category);
  }
  if (filters.title) {
    clauses.push(`title = $${params.length + 1}`);
    params.push(filters.title);
  }
  if (filters.related_company) {
    const companyParam = `$${params.length + 1}`;
    clauses.push(`EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(building_relationship_lines, '[]'::jsonb)) AS rel(line)
      JOIN companies_v1 related_company
        ON ${sqlJoinV1Company("related_company", "rel.line->>'company_id'")}
      WHERE related_company.company_name_en ILIKE ${companyParam}
         OR related_company.business_id ILIKE ${companyParam}
    )`);
    params.push(`%${filters.related_company}%`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await query<PropertyV1>(
    `SELECT ${select} FROM properties_v1 ${where} ORDER BY bldg_name_en ASC NULLS LAST, property_id ASC`,
    params,
  );
  return rows.map((row) => ({ ...row, building_relationship_lines: normalizeBuildingRelationships(row.building_relationship_lines) }));
}

export async function countPropertiesV1(): Promise<number> {
  const rows = await query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM properties_v1`);
  return Number.parseInt(rows[0]?.n ?? "0", 10);
}

export async function getPropertyV1(propertyId: string): Promise<PropertyV1 | null> {
  const ref = propertyId.trim();
  if (!ref) return null;
  const rows = await query<PropertyV1>(
    `SELECT ${select} FROM properties_v1 WHERE property_id = $1 OR business_id = $1 LIMIT 1`,
    [ref],
  );
  if (rows[0]) return { ...rows[0], building_relationship_lines: normalizeBuildingRelationships(rows[0].building_relationship_lines) };

  // Crosswalk fallback: B100001 → properties_v1.property_id
  const crosswalk = await query<{ primary_ref: string }>(
    `SELECT primary_ref FROM business_id_crosswalk
     WHERE entity_type = 'building' AND business_id = $1
     LIMIT 1`,
    [ref],
  );
  const primaryRef = crosswalk[0]?.primary_ref?.trim();
  if (!primaryRef) return null;
  const byPrimary = await query<PropertyV1>(
    `SELECT ${select} FROM properties_v1 WHERE property_id = $1 LIMIT 1`,
    [primaryRef],
  );
  return byPrimary[0] ? { ...byPrimary[0], building_relationship_lines: normalizeBuildingRelationships(byPrimary[0].building_relationship_lines) } : null;
}

export type PropertyV1Patch = Partial<
  Omit<PropertyV1, "property_id" | "updated_at" | "bldg_area_sqft" | "bldg_area_sqm" | "plot_ratio" | "site_area_sqft" | "site_area_sqm"> & {
    bldg_area_sqft?: number | null;
    bldg_area_sqm?: number | null;
    plot_ratio?: number | null;
    site_area_sqft?: number | null;
    site_area_sqm?: number | null;
  }
>;

export async function updatePropertyV1(propertyId: string, patch: PropertyV1Patch): Promise<void> {
  const coerced = await coercePropertyV1PatchForDb(patch);
  const entries = Object.entries(coerced).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const sets: string[] = [];
  const params: unknown[] = [propertyId];
  let i = 2;
  for (const [k, v] of entries) {
    sets.push(`${k} = $${i}`);
    params.push(k === "building_relationship_lines" ? JSON.stringify(normalizeBuildingRelationships(v)) : v);
    i++;
  }
  try {
    await query(`UPDATE properties_v1 SET ${sets.join(", ")} WHERE property_id = $1`, params);
  } catch (err) {
    const debug = formatSqlParamDebug(describePropertyV1UpdateParams(propertyId, coerced));
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${message} | properties_v1 UPDATE params: ${debug}`);
  }
}

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

export async function allocatePropertyV1Id(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BLDG-${year}-`;
  const rows = await query<{ property_id: string }>(
    `SELECT property_id FROM properties_v1
     WHERE property_id LIKE $1
     ORDER BY property_id DESC
     LIMIT 1`,
    [`${prefix}%`],
  );
  let seq = 1;
  const last = rows[0]?.property_id;
  if (last) {
    const match = last.match(/-(\d{4})$/);
    if (match) seq = Number.parseInt(match[1], 10) + 1;
  }
  return `${prefix}${pad4(seq)}`;
}

export function emptyPropertyV1(): PropertyV1 {
  return {
    property_id: "",
    business_id: null,
    bldg_name_en: null,
    bldg_name_zh: null,
    bldg_name_cn: null,
    building_type: null,
    tower_block: null,
    floor_count: null,
    bldg_area_sqft: null,
    bldg_area_sqm: null,
    year_built: null,
    bldg_desc: null,
    bldg_desc_zh: null,
    bldg_desc_cn: null,
    location_advantages_en: null,
    location_advantages_zh: null,
    location_advantages_cn: null,
    proposal_highlights_en: null,
    proposal_highlights_zh: null,
    proposal_highlights_cn: null,
    building_remarks: null,
    land_use: null,
    class_of_site: null,
    land_tenure: null,
    plot_ratio: null,
    site_area_sqft: null,
    site_area_sqm: null,
    country: null,
    city_en: null,
    city_zh: null,
    city_cn: null,
    district_en: null,
    district_zh: null,
    district_cn: null,
    street_no: null,
    street_name_en: null,
    street_name_zh: null,
    street_name_cn: null,
    full_address_en: null,
    full_address_zh: null,
    full_address_cn: null,
    mtr_station: null,
    walking_minutes: null,
    facilities: null,
    facilities_zh: null,
    facilities_cn: null,
    green_certification: null,
    lot_number: null,
    grade: null,
    management_company_id: null,
    operator_company_id: null,
    current_tenant_company_id: null,
    owner_company_id: null,
    title: null,
    inventory_count: null,
    inventory_count_sales: null,
    inventory_count_lease: null,
    building_relationship_lines: [],
    updated_at: "",
  };
}

export async function createPropertyV1(patch: PropertyV1Patch): Promise<string> {
  const propertyId = await allocatePropertyV1Id();
  const businessId = await allocateNextBusinessId("building");
  const coerced = await coercePropertyV1PatchForDb({ ...patch, business_id: businessId });
  const entries = Object.entries(coerced).filter(([, v]) => v !== undefined);
  const columns = ["property_id", ...entries.map(([k]) => k)];
  const placeholders = columns.map((_, i) => `$${i + 1}`);
  const params: unknown[] = [propertyId, ...entries.map(([k, v]) => k === "building_relationship_lines" ? JSON.stringify(normalizeBuildingRelationships(v)) : v)];
  await query(
    `INSERT INTO properties_v1 (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    params,
  );
  await registerBusinessId({
    entityType: "building",
    businessId,
    primaryRef: propertyId,
    deprecatedRef: propertyId,
  });
  return propertyId;
}

export async function deletePropertiesV1(propertyIds: string[]): Promise<void> {
  if (propertyIds.length === 0) return;
  await query(`DELETE FROM properties_v1 WHERE property_id = ANY($1::text[])`, [propertyIds]);
}

export type PropertyV1SelectOption = {
  property_id: string;
  business_id?: string | null;
  label: string;
  name_en?: string | null;
  name_zh?: string | null;
  name_cn?: string | null;
  remarks?: string | null;
  description?: string | null;
  full_address?: string | null;
  mtr_station?: string | null;
  street_no?: string | null;
  street_name_en?: string | null;
  street_name_zh?: string | null;
  street_name_cn?: string | null;
  country: string | null;
  city: string | null;
  district: string | null;
};

export async function listPropertyV1SelectOptions(): Promise<PropertyV1SelectOption[]> {
  const rows = await query<{
    property_id: string;
    business_id: string | null;
    bldg_name_en: string | null;
    bldg_name_zh: string | null;
    bldg_name_cn: string | null;
    building_remarks: string | null;
    bldg_desc: string | null;
    full_address_en: string | null;
    mtr_station: string | null;
    street_no: string | null;
    street_name_en: string | null;
    street_name_zh: string | null;
    street_name_cn: string | null;
    district_en: string | null;
    country: string | null;
    city_en: string | null;
  }>(
    `SELECT property_id, business_id, bldg_name_en, bldg_name_zh, bldg_name_cn, building_remarks,
            bldg_desc, full_address_en, mtr_station,
            street_no, street_name_en, street_name_zh, street_name_cn,
            district_en, country, city_en
     FROM properties_v1
     ORDER BY bldg_name_en ASC NULLS LAST, property_id ASC`,
  );
  return rows.map((row) => {
    const name = row.bldg_name_en?.trim() || row.property_id;
    const district = row.district_en?.trim();
    return {
      property_id: row.property_id,
      business_id: row.business_id?.trim() || null,
      label: district ? `${name} · ${district}` : name,
      name_en: row.bldg_name_en?.trim() || null,
      name_zh: row.bldg_name_zh?.trim() || null,
      name_cn: row.bldg_name_cn?.trim() || null,
      remarks: row.building_remarks?.trim() || null,
      description: row.bldg_desc?.trim() || null,
      full_address: row.full_address_en?.trim() || null,
      mtr_station: row.mtr_station?.trim() || null,
      street_no: row.street_no?.trim() || null,
      street_name_en: row.street_name_en?.trim() || null,
      street_name_zh: row.street_name_zh?.trim() || null,
      street_name_cn: row.street_name_cn?.trim() || null,
      country: row.country?.trim() || null,
      city: row.city_en?.trim() || null,
      district: district || null,
    };
  });
}
