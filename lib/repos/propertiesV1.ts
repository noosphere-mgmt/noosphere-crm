import { query } from "@/lib/db";
import { sqlJoinV1Company } from "@/lib/import/lookupSql";

export type PropertyV1 = {
  property_id: string;
  bldg_name_en: string | null;
  bldg_name_zh: string | null;
  bldg_name_cn: string | null;
  tower_block: string | null;
  floor_count: number | null;
  bldg_area_sqft: string | null;
  bldg_area_sqm: string | null;
  year_built: number | null;
  bldg_desc: string | null;
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
  updated_at: string;
};

const select = `
  property_id,
  bldg_name_en, bldg_name_zh, bldg_name_cn,
  tower_block, floor_count,
  bldg_area_sqft::text AS bldg_area_sqft,
  bldg_area_sqm::text AS bldg_area_sqm,
  year_built,
  bldg_desc,
  building_remarks,
  land_use, class_of_site, land_tenure,
  plot_ratio::text AS plot_ratio,
  site_area_sqft::text AS site_area_sqft,
  site_area_sqm::text AS site_area_sqm,
  country, city_en, city_zh, city_cn,
  district_en, district_zh, district_cn,
  street_no, street_name_en, street_name_zh, street_name_cn,
  full_address_en, full_address_zh, full_address_cn,
  mtr_station, walking_minutes, facilities, green_certification, lot_number,
  grade, management_company_id, operator_company_id, current_tenant_company_id, owner_company_id, title,
  inventory_count, inventory_count_sales, inventory_count_lease,
  updated_at::text AS updated_at
`;

export type PropertiesListFilters = {
  q?: string;
};

export async function listPropertiesV1(filters: PropertiesListFilters = {}): Promise<PropertyV1[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.q) {
    clauses.push(`(
      bldg_name_en ILIKE $1
      OR bldg_name_zh ILIKE $1
      OR bldg_name_cn ILIKE $1
      OR full_address_en ILIKE $1
      OR full_address_zh ILIKE $1
      OR full_address_cn ILIKE $1
      OR district_en ILIKE $1
      OR district_zh ILIKE $1
      OR district_cn ILIKE $1
      OR city_en ILIKE $1
      OR city_zh ILIKE $1
      OR city_cn ILIKE $1
      OR EXISTS (
        SELECT 1 FROM companies_v1 co
        WHERE ${sqlJoinV1Company("co", "properties_v1.operator_company_id")}
          AND co.company_name_en ILIKE $1
      )
    )`);
    params.push(`%${filters.q}%`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  return query<PropertyV1>(
    `SELECT ${select} FROM properties_v1 ${where} ORDER BY bldg_name_en ASC NULLS LAST, property_id ASC`,
    params,
  );
}

export async function countPropertiesV1(): Promise<number> {
  const rows = await query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM properties_v1`);
  return Number.parseInt(rows[0]?.n ?? "0", 10);
}

export async function getPropertyV1(propertyId: string): Promise<PropertyV1 | null> {
  const rows = await query<PropertyV1>(`SELECT ${select} FROM properties_v1 WHERE property_id = $1 LIMIT 1`, [propertyId]);
  return rows[0] ?? null;
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
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;

  const sets: string[] = [];
  const params: unknown[] = [propertyId];
  let i = 2;
  for (const [k, v] of entries) {
    sets.push(`${k} = $${i}`);
    params.push(v);
    i++;
  }
  await query(`UPDATE properties_v1 SET ${sets.join(", ")} WHERE property_id = $1`, params);
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
    bldg_name_en: null,
    bldg_name_zh: null,
    bldg_name_cn: null,
    tower_block: null,
    floor_count: null,
    bldg_area_sqft: null,
    bldg_area_sqm: null,
    year_built: null,
    bldg_desc: null,
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
    updated_at: "",
  };
}

export async function createPropertyV1(patch: PropertyV1Patch): Promise<string> {
  const propertyId = await allocatePropertyV1Id();
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
  const columns = ["property_id", ...entries.map(([k]) => k)];
  const placeholders = columns.map((_, i) => `$${i + 1}`);
  const params: unknown[] = [propertyId, ...entries.map(([, v]) => v)];
  await query(
    `INSERT INTO properties_v1 (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    params,
  );
  return propertyId;
}

export async function deletePropertiesV1(propertyIds: string[]): Promise<void> {
  if (propertyIds.length === 0) return;
  await query(`DELETE FROM properties_v1 WHERE property_id = ANY($1::text[])`, [propertyIds]);
}

export type PropertyV1SelectOption = {
  property_id: string;
  label: string;
};

export async function listPropertyV1SelectOptions(): Promise<PropertyV1SelectOption[]> {
  const rows = await query<{
    property_id: string;
    bldg_name_en: string | null;
    district_en: string | null;
  }>(
    `SELECT property_id, bldg_name_en, district_en
     FROM properties_v1
     ORDER BY bldg_name_en ASC NULLS LAST, property_id ASC`,
  );
  return rows.map((row) => {
    const name = row.bldg_name_en?.trim() || row.property_id;
    const district = row.district_en?.trim();
    return {
      property_id: row.property_id,
      label: district ? `${name} · ${district}` : name,
    };
  });
}

