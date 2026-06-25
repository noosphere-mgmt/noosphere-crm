import { query } from "@/lib/db";
import { allocatePropertyV1Id } from "@/lib/repos/propertiesV1";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { sqlExportCompanyId, sqlJoinV1Company } from "../lookupSql";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import {
  mergeReferenceResults,
  resolveCompanyV1IdOrName,
} from "../referenceResolution";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord, ImportWriteContext, RecordId } from "../types";

const FIELD_KEYS = [
  "building_id",
  "external_ref",
  "building_name_en",
  "building_name_zh",
  "building_name_cn",
  "country",
  "city",
  "district",
  "address",
  "grade",
  "title",
  "management_company_id",
  "management_company_name_en",
  "operator_company_id",
  "operator_company_name_en",
  "owner_company_id",
  "owner_company_name_en",
  "year_built",
  "no_of_floors",
  "building_area_sqft",
  "building_area_sqm",
  "lot_number",
  "land_use",
  "class_of_site",
  "land_tenure",
  "plot_ratio",
  "site_area_sqft",
  "site_area_sqm",
  "remarks",
  "last_verified_date",
] as const;

const SELECT = `
  p.business_id AS building_id,
  p.external_ref,
  p.bldg_name_en AS building_name_en,
  p.bldg_name_zh AS building_name_zh,
  p.bldg_name_cn AS building_name_cn,
  p.country,
  p.city_en AS city,
  p.district_en AS district,
  p.full_address_en AS address,
  p.grade, p.title,
  ${sqlExportCompanyId("p.management_company_id")} AS management_company_id,
  mgmt.company_name_en AS management_company_name_en,
  ${sqlExportCompanyId("p.operator_company_id")} AS operator_company_id,
  opco.company_name_en AS operator_company_name_en,
  ${sqlExportCompanyId("p.owner_company_id")} AS owner_company_id,
  own.company_name_en AS owner_company_name_en,
  p.year_built,
  p.floor_count AS no_of_floors,
  p.bldg_area_sqft::text AS building_area_sqft,
  p.bldg_area_sqm::text AS building_area_sqm,
  p.lot_number, p.land_use, p.class_of_site, p.land_tenure,
  p.plot_ratio::text AS plot_ratio,
  p.site_area_sqft::text AS site_area_sqft,
  p.site_area_sqm::text AS site_area_sqm,
  p.building_remarks AS remarks,
  p.last_verified_date::text AS last_verified_date
`;

const FROM = `
  properties_v1 p
  LEFT JOIN companies_v1 mgmt ON ${sqlJoinV1Company("mgmt", "p.management_company_id")}
  LEFT JOIN companies_v1 opco ON ${sqlJoinV1Company("opco", "p.operator_company_id")}
  LEFT JOIN companies_v1 own ON ${sqlJoinV1Company("own", "p.owner_company_id")}
`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if ("building_name_en" in values) p.bldg_name_en = values.building_name_en;
  if ("building_name_zh" in values) p.bldg_name_zh = values.building_name_zh;
  if ("building_name_cn" in values) p.bldg_name_cn = values.building_name_cn;
  if ("city" in values) p.city_en = values.city;
  if ("district" in values) p.district_en = values.district;
  if ("address" in values) p.full_address_en = values.address;
  if ("no_of_floors" in values) p.floor_count = values.no_of_floors;
  if ("building_area_sqft" in values) p.bldg_area_sqft = values.building_area_sqft;
  if ("building_area_sqm" in values) p.bldg_area_sqm = values.building_area_sqm;
  if ("remarks" in values) p.building_remarks = values.remarks;
  for (const k of [
    "external_ref",
    "country",
    "grade",
    "title",
    "management_company_id",
    "operator_company_id",
    "owner_company_id",
    "year_built",
    "lot_number",
    "land_use",
    "class_of_site",
    "land_tenure",
    "plot_ratio",
    "site_area_sqft",
    "site_area_sqm",
    "last_verified_date",
  ] as const) {
    if (k in values) p[k] = values[k];
  }
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${SELECT} FROM ${FROM} WHERE ${where}`,
    params,
  );
  return rows.map((row) => rowToRecord(row, String(row.building_id), FIELD_KEYS));
}

export const buildingsImportDefinition: ImportObjectDefinition = {
  objectType: "buildings",
  tableName: "properties_v1",
  matchIdField: "building_id",
  idType: "text",

  fields: [
    { key: "building_id", label: "building_id", type: "string", matchOnly: true, aliases: ["property_id"] },
    { key: "external_ref", label: "external_ref", type: "string" },
    { key: "building_name_en", label: "building_name_en", type: "string", requiredOnCreate: true, aliases: ["name_en"] },
    { key: "building_name_zh", label: "building_name_zh", type: "string" },
    { key: "building_name_cn", label: "building_name_cn", type: "string" },
    { key: "country", label: "country", type: "string", defaultValue: "Hong Kong" },
    { key: "city", label: "city", type: "string", defaultValue: "Hong Kong" },
    { key: "district", label: "district", type: "string", requiredOnCreate: true },
    { key: "address", label: "address", type: "string" },
    { key: "grade", label: "grade", type: "string" },
    { key: "title", label: "title", type: "string" },
    { key: "management_company_id", label: "management_company_id", type: "string" },
    { key: "management_company_name_en", label: "management_company_name_en", type: "string", lookupOnly: true },
    { key: "operator_company_id", label: "operator_company_id", type: "string" },
    { key: "operator_company_name_en", label: "operator_company_name_en", type: "string", lookupOnly: true },
    { key: "owner_company_id", label: "owner_company_id", type: "string" },
    { key: "owner_company_name_en", label: "owner_company_name_en", type: "string", lookupOnly: true },
    { key: "year_built", label: "year_built", type: "number", integer: true },
    { key: "no_of_floors", label: "no_of_floors", type: "number", integer: true },
    { key: "building_area_sqft", label: "building_area_sqft", type: "number" },
    { key: "building_area_sqm", label: "building_area_sqm", type: "number" },
    { key: "lot_number", label: "lot_number", type: "string" },
    { key: "land_use", label: "land_use", type: "string" },
    { key: "class_of_site", label: "class_of_site", type: "string" },
    { key: "land_tenure", label: "land_tenure", type: "string" },
    { key: "plot_ratio", label: "plot_ratio", type: "number" },
    { key: "site_area_sqft", label: "site_area_sqft", type: "number" },
    { key: "site_area_sqm", label: "site_area_sqm", type: "number" },
    { key: "remarks", label: "remarks", type: "string" },
    { key: "last_verified_date", label: "last_verified_date", type: "date" },
  ],

  async findById(id) {
    const rows = await load("p.property_id = $1", [String(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef(externalRef) {
    return load("p.external_ref = $1", [externalRef.trim()]);
  },

  buildNaturalKey(values) {
    const name = String(values.building_name_en ?? "").trim();
    const district = String(values.district ?? "").trim();
    const city = String(values.city ?? "").trim();
    if (!name || !district) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([name, district, city]) };
  },

  async findByNaturalKey(key) {
    const parts = splitNaturalKeyParts(key, 3);
    if (!parts) return [];
    const [name, district, city] = parts;
    const rows = await query<{ property_id: string }>(
      `SELECT property_id FROM properties_v1
       WHERE lower(trim(bldg_name_en)) = $1
         AND lower(trim(district_en)) = $2
         AND lower(trim(coalesce(city_en, ''))) = $3`,
      [name, district, city ?? ""],
    );
    if (rows.length === 0) return [];
    return load(`p.property_id = ANY($1::text[])`, [rows.map((r) => r.property_id)]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    const companyRefs = [
      ["management_company_id", "management_company_name_en"],
      ["operator_company_id", "operator_company_name_en"],
      ["owner_company_id", "owner_company_name_en"],
    ] as const;
    const results = [];
    for (const [idField, nameField] of companyRefs) {
      if (
        suppliedFields.has(idField) ||
        idField in writable ||
        suppliedFields.has(nameField)
      ) {
        results.push(
          await resolveCompanyV1IdOrName(
            idField,
            nameField,
            values,
            suppliedFields,
            existing,
            writable,
            false,
          ),
        );
      }
    }
    return mergeReferenceResults(...results);
  },

  async createRecord(values, ctx) {
    const v = applySessionMetadata(values, ctx);
    const patch = dbPatch(v);
    if (!patch.bldg_name_en) patch.bldg_name_en = v.building_name_en;
    if (!patch.district_en) patch.district_en = v.district ?? "";
    if (!patch.city_en) patch.city_en = v.city ?? "Hong Kong";
    if (!patch.country) patch.country = v.country ?? "Hong Kong";
    const id = v.building_id ? String(v.building_id).trim() : await allocatePropertyV1Id();
    await query(
      `INSERT INTO properties_v1 (property_id, bldg_name_en, district_en, city_en, country)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, patch.bldg_name_en ?? "", patch.district_en ?? "", patch.city_en ?? "Hong Kong", patch.country ?? "Hong Kong"],
    );
    await genericUpdateRecord("properties_v1", "property_id", id, dbPatch(v), ctx);
    return id;
  },

  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("properties_v1", "property_id", id, dbPatch(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(
      `SELECT ${SELECT} FROM ${FROM} ORDER BY building_name_en ASC NULLS LAST`,
    );
    return rows.map((r) => {
      const rec = rowToRecord(r, String(r.building_id), FIELD_KEYS);
      return rec.values;
    });
  },
};
