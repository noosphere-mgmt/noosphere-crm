import { query } from "@/lib/db";
import type { Building, PropertyStatus } from "@/lib/types/entities";

const buildingSelect = `
  b.id, b.property_id, b.name_en, b.name_zh, b.property_type, b.centre_type, b.status,
  b.country, b.city, b.district, b.street_no, b.street_name_en, b.street_name_zh,
  b.full_address_en, b.full_address_zh, b.lot_number, b.land_use, b.ownership_type,
  b.source_url, b.last_verified_date::text, b.latitude, b.longitude,
  b.tower_block, b.floor_count, b.typical_floor_area_sqft::text, b.year_built,
  b.grade, b.mtr_station, b.walking_minutes, b.facilities, b.green_certification, b.remarks,
  b.created_at::text, b.updated_at::text
`;

export type BuildingInput = {
  property_id?: number | null;
  name_en: string;
  name_zh?: string | null;
  property_type?: string;
  centre_type?: string | null;
  status?: PropertyStatus;
  country?: string;
  city?: string;
  district?: string;
  street_no?: string | null;
  street_name_en?: string | null;
  street_name_zh?: string | null;
  full_address_en?: string;
  full_address_zh?: string | null;
  lot_number?: string | null;
  land_use?: string | null;
  ownership_type?: string | null;
  source_url?: string | null;
  last_verified_date?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  tower_block?: string | null;
  floor_count?: number | null;
  typical_floor_area_sqft?: number | null;
  year_built?: number | null;
  grade?: string | null;
  mtr_station?: string | null;
  walking_minutes?: number | null;
  facilities?: string | null;
  green_certification?: string | null;
  remarks?: string | null;
};

function buildingValues(input: BuildingInput) {
  return [
    input.property_id ?? null,
    input.name_en.trim(),
    input.name_zh?.trim() || null,
    input.property_type?.trim() || "Commercial Building",
    input.centre_type?.trim() || null,
    input.status ?? "active",
    input.country?.trim() || "Hong Kong",
    input.city?.trim() || "Hong Kong",
    input.district?.trim() || "",
    input.street_no?.trim() || null,
    input.street_name_en?.trim() || null,
    input.street_name_zh?.trim() || null,
    input.full_address_en?.trim() || "",
    input.full_address_zh?.trim() || null,
    input.lot_number?.trim() || null,
    input.land_use?.trim() || null,
    input.ownership_type?.trim() || null,
    input.source_url?.trim() || null,
    input.last_verified_date?.trim() || null,
    input.latitude ?? null,
    input.longitude ?? null,
    input.tower_block?.trim() || null,
    input.floor_count ?? null,
    input.typical_floor_area_sqft ?? null,
    input.year_built ?? null,
    input.grade?.trim() || null,
    input.mtr_station?.trim() || null,
    input.walking_minutes ?? null,
    input.facilities?.trim() || null,
    input.green_certification?.trim() || null,
    input.remarks?.trim() || null,
  ];
}

async function syncLegacySiteProperty(input: BuildingInput, legacyPropertyId: number): Promise<void> {
  await query(
    `UPDATE _deprecated_sites SET
       name_en = $2, name_zh = $3, property_type = $4, centre_type = $5, status = $6,
       country = $7, city = $8, district = $9, street_no = $10, street_name_en = $11, street_name_zh = $12,
       full_address_en = $13, full_address_zh = $14, lot_number = $15, land_use = $16, ownership_type = $17,
       source_url = $18, last_verified_date = $19, latitude = $20, longitude = $21, remarks = $22
     WHERE id = $1`,
    [legacyPropertyId, ...buildingValues(input).slice(1)],
  );
}

export async function listBuildings(): Promise<Building[]> {
  return query<Building>(
    `SELECT ${buildingSelect} FROM buildings b ORDER BY b.name_en ASC, b.id ASC`,
  );
}

export async function listBuildingsForProperty(legacyPropertyId: number): Promise<Building[]> {
  return query<Building>(
    `SELECT ${buildingSelect} FROM buildings b WHERE b.property_id = $1 ORDER BY b.id ASC`,
    [legacyPropertyId],
  );
}

export async function getBuilding(id: number): Promise<Building | null> {
  const rows = await query<Building>(
    `SELECT ${buildingSelect} FROM buildings b WHERE b.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getLegacySitePropertyIdForBuilding(buildingId: number): Promise<number | null> {
  const rows = await query<{ property_id: string | null }>(
    `SELECT property_id::text FROM buildings WHERE id = $1`,
    [buildingId],
  );
  const id = rows[0]?.property_id;
  return id ? Number.parseInt(id, 10) : null;
}

export async function createBuilding(input: BuildingInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO buildings (
       property_id, name_en, name_zh, property_type, centre_type, status,
       country, city, district, street_no, street_name_en, street_name_zh,
       full_address_en, full_address_zh, lot_number, land_use, ownership_type,
       source_url, last_verified_date, latitude, longitude,
       tower_block, floor_count, typical_floor_area_sqft, year_built, grade,
       mtr_station, walking_minutes, facilities, green_certification, remarks
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
       $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
     )
     RETURNING id::text AS id`,
    buildingValues(input),
  );
  const id = Number.parseInt(rows[0]!.id, 10);
  if (input.property_id) {
    await syncLegacySiteProperty(input, input.property_id);
  }
  return id;
}

export async function updateBuilding(id: number, input: BuildingInput): Promise<void> {
  await query(
    `UPDATE buildings SET
       property_id = $2, name_en = $3, name_zh = $4, property_type = $5, centre_type = $6, status = $7,
       country = $8, city = $9, district = $10, street_no = $11, street_name_en = $12, street_name_zh = $13,
       full_address_en = $14, full_address_zh = $15, lot_number = $16, land_use = $17, ownership_type = $18,
       source_url = $19, last_verified_date = $20, latitude = $21, longitude = $22,
       tower_block = $23, floor_count = $24, typical_floor_area_sqft = $25, year_built = $26, grade = $27,
       mtr_station = $28, walking_minutes = $29, facilities = $30, green_certification = $31, remarks = $32
     WHERE id = $1`,
    [id, ...buildingValues(input)],
  );
  if (input.property_id) {
    await syncLegacySiteProperty(input, input.property_id);
  }
}

export async function deleteBuilding(id: number): Promise<void> {
  await query(`DELETE FROM buildings WHERE id = $1`, [id]);
}

export async function listBuildingOptions(): Promise<
  Array<{ id: number; property_id: number | null; label: string }>
> {
  return query<{ id: number; property_id: number | null; label: string }>(
    `SELECT b.id, b.property_id,
            b.name_en
            || CASE WHEN NULLIF(b.tower_block, '') IS NOT NULL THEN ' · ' || b.tower_block ELSE '' END
            || CASE WHEN NULLIF(b.district, '') IS NOT NULL THEN ' · ' || b.district ELSE '' END
            AS label
     FROM buildings b
     ORDER BY b.name_en ASC, b.id ASC`,
  );
}
