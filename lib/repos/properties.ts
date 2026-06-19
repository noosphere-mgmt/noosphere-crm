import { query } from "@/lib/db";
import type { Property, PropertyStatus } from "@/lib/types/entities";

/** Legacy site table renamed in Phase 9a. Inventory uses `properties` (Phase 9b+). */
const LEGACY_SITE_TABLE = "_deprecated_sites";

const propertySelect = `
  id, name_en, name_zh, property_type, centre_type, status,
  country, city, district, street_no, street_name_en, street_name_zh,
  full_address_en, full_address_zh, lot_number, land_use, ownership_type,
  source_url, last_verified_date::text, latitude, longitude, remarks,
  created_at::text, updated_at::text
`;

export type PropertyInput = {
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
  remarks?: string | null;
};

function propertyValues(input: PropertyInput) {
  return [
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
    input.remarks?.trim() || null,
  ];
}

export async function listProperties(): Promise<Property[]> {
  return query<Property>(
    `SELECT ${propertySelect} FROM ${LEGACY_SITE_TABLE} ORDER BY updated_at DESC, id DESC`,
  );
}

export async function getProperty(id: number): Promise<Property | null> {
  const rows = await query<Property>(
    `SELECT ${propertySelect} FROM ${LEGACY_SITE_TABLE} WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createProperty(input: PropertyInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO ${LEGACY_SITE_TABLE} (
       name_en, name_zh, property_type, centre_type, status,
       country, city, district, street_no, street_name_en, street_name_zh,
       full_address_en, full_address_zh, lot_number, land_use, ownership_type,
       source_url, last_verified_date, latitude, longitude, remarks
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
     RETURNING id::text AS id`,
    propertyValues(input),
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateProperty(id: number, input: PropertyInput & { status: PropertyStatus; property_type: string; country: string; city: string; district: string; full_address_en: string }): Promise<void> {
  await query(
    `UPDATE ${LEGACY_SITE_TABLE} SET
       name_en = $2, name_zh = $3, property_type = $4, centre_type = $5, status = $6,
       country = $7, city = $8, district = $9, street_no = $10, street_name_en = $11, street_name_zh = $12,
       full_address_en = $13, full_address_zh = $14, lot_number = $15, land_use = $16, ownership_type = $17,
       source_url = $18, last_verified_date = $19, latitude = $20, longitude = $21, remarks = $22
     WHERE id = $1`,
    [id, ...propertyValues(input)],
  );
}

export async function deleteProperty(id: number): Promise<void> {
  await query(`DELETE FROM ${LEGACY_SITE_TABLE} WHERE id = $1`, [id]);
}

export async function listPropertyOptions(): Promise<
  Array<{ id: number; name_en: string; district: string }>
> {
  return query<{ id: number; name_en: string; district: string }>(
    `SELECT id, name_en, district FROM ${LEGACY_SITE_TABLE} ORDER BY name_en ASC`,
  );
}
