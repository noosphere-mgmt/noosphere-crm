import { query } from "@/lib/db";
import { allocateNextBusinessId, registerBusinessId } from "@/lib/businessIdResolve";
import { isPermanentBusinessId } from "@/lib/businessIds";
import {
  mergeLegacyCompanyIdsIntoBuildingRelationships,
  syncLegacyCompanyIdsFromBuildingRelationships,
} from "@/lib/buildingRelationships";
import { allocatePropertyV1Id } from "@/lib/repos/propertiesV1";
import { applySessionMetadata, genericUpdateRecord, rowToRecord, withExportMatchIds } from "../adapterUtils";
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
  "building_type",
  "country",
  "city",
  "city_zh",
  "city_cn",
  "district",
  "district_zh",
  "district_cn",
  "street_name_en",
  "street_name_zh",
  "street_name_cn",
  "street_no",
  "address",
  "address_zh",
  "address_cn",
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
  "mtr_station",
  "walking_minutes",
  "lot_number",
  "land_use",
  "class_of_site",
  "land_tenure",
  "plot_ratio",
  "site_area_sqft",
  "site_area_sqm",
  "building_description_en",
  "building_description_zh",
  "building_description_cn",
  "location_advantages_en",
  "location_advantages_zh",
  "location_advantages_cn",
  "facilities_en",
  "facilities_zh",
  "facilities_cn",
  "proposal_highlights_en",
  "proposal_highlights_zh",
  "proposal_highlights_cn",
  "building_relationships",
  "remarks",
  "last_verified_date",
] as const;

const SELECT = `
  p.property_id AS building_pk,
  p.business_id AS building_id,
  p.external_ref,
  p.bldg_name_en AS building_name_en,
  p.bldg_name_zh AS building_name_zh,
  p.bldg_name_cn AS building_name_cn,
  p.building_type,
  p.country,
  p.city_en AS city,
  p.city_zh, p.city_cn,
  p.district_en AS district,
  p.district_zh, p.district_cn,
  p.street_name_en AS street_name_en,
  p.street_name_zh AS street_name_zh,
  p.street_name_cn AS street_name_cn,
  p.street_no AS street_no,
  p.full_address_en AS address,
  p.full_address_zh AS address_zh,
  p.full_address_cn AS address_cn,
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
  p.mtr_station,
  p.walking_minutes,
  p.lot_number, p.land_use, p.class_of_site, p.land_tenure,
  p.plot_ratio::text AS plot_ratio,
  p.site_area_sqft::text AS site_area_sqft,
  p.site_area_sqm::text AS site_area_sqm,
  p.bldg_desc AS building_description_en,
  p.bldg_desc_zh AS building_description_zh,
  p.bldg_desc_cn AS building_description_cn,
  p.location_advantages_en,
  p.location_advantages_zh,
  p.location_advantages_cn,
  p.facilities AS facilities_en,
  p.facilities_zh,
  p.facilities_cn,
  p.proposal_highlights_en,
  p.proposal_highlights_zh,
  p.proposal_highlights_cn,
  p.building_relationship_lines AS building_relationships,
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
  if ("city_zh" in values) p.city_zh = values.city_zh;
  if ("city_cn" in values) p.city_cn = values.city_cn;
  if ("district" in values) p.district_en = values.district;
  if ("district_zh" in values) p.district_zh = values.district_zh;
  if ("district_cn" in values) p.district_cn = values.district_cn;
  if ("address" in values) p.full_address_en = values.address;
  if ("address_zh" in values) p.full_address_zh = values.address_zh;
  if ("address_cn" in values) p.full_address_cn = values.address_cn;
  if ("no_of_floors" in values) p.floor_count = values.no_of_floors;
  if ("building_area_sqft" in values) p.bldg_area_sqft = values.building_area_sqft;
  if ("building_area_sqm" in values) p.bldg_area_sqm = values.building_area_sqm;
  if ("remarks" in values) p.building_remarks = values.remarks;
  if ("building_description_en" in values) p.bldg_desc = values.building_description_en;
  if ("building_description_zh" in values) p.bldg_desc_zh = values.building_description_zh;
  if ("building_description_cn" in values) p.bldg_desc_cn = values.building_description_cn;
  if ("facilities_en" in values) p.facilities = values.facilities_en;
  if ("building_relationships" in values) p.building_relationship_lines = values.building_relationships;
  for (const k of [
    "external_ref",
    "building_type",
    "country",
    "street_no",
    "street_name_en",
    "street_name_zh",
    "street_name_cn",
    "grade",
    "title",
    "management_company_id",
    "operator_company_id",
    "owner_company_id",
    "year_built",
    "mtr_station",
    "walking_minutes",
    "lot_number",
    "land_use",
    "class_of_site",
    "land_tenure",
    "plot_ratio",
    "site_area_sqft",
    "site_area_sqm",
    "location_advantages_en",
    "location_advantages_zh",
    "location_advantages_cn",
    "facilities_zh",
    "facilities_cn",
    "proposal_highlights_en",
    "proposal_highlights_zh",
    "proposal_highlights_cn",
    "last_verified_date",
  ] as const) {
    if (k in values) p[k] = values[k];
  }

  // Keep Owner/Landlord in relationships when owner_company_id is supplied (and vice versa).
  const lines = mergeLegacyCompanyIdsIntoBuildingRelationships(p.building_relationship_lines, {
    owner_company_id: (p.owner_company_id as string | null | undefined) ?? null,
    management_company_id: (p.management_company_id as string | null | undefined) ?? null,
    current_tenant_company_id: null,
  });
  const synced = syncLegacyCompanyIdsFromBuildingRelationships(lines);
  p.building_relationship_lines = lines;
  if (synced.owner_company_id) p.owner_company_id = synced.owner_company_id;
  if (synced.management_company_id) p.management_company_id = synced.management_company_id;

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
    {
      key: "building_name_en",
      label: "building_name_en",
      type: "string",
      requiredOnCreate: true,
      aliases: ["name_en", "bldg_name_en", "building name", "building name (en)", "name"],
    },
    { key: "building_name_zh", label: "building_name_zh", type: "string", aliases: ["bldg_name_zh"] },
    { key: "building_name_cn", label: "building_name_cn", type: "string", aliases: ["bldg_name_cn"] },
    { key: "building_type", label: "building_type", type: "string", aliases: ["category"] },
    { key: "country", label: "country", type: "string", defaultValue: "Hong Kong" },
    {
      key: "city",
      label: "city",
      type: "string",
      defaultValue: "Hong Kong",
      aliases: ["city_en", "city (en)"],
    },
    { key: "city_zh", label: "city_zh", type: "string" },
    { key: "city_cn", label: "city_cn", type: "string" },
    {
      key: "district",
      label: "district",
      type: "string",
      aliases: ["district_en", "district (en)", "district en"],
    },
    { key: "district_zh", label: "district_zh", type: "string", aliases: ["district (zh)"] },
    { key: "district_cn", label: "district_cn", type: "string", aliases: ["district (cn)"] },
    { key: "street_name_en", label: "street_name_en", type: "string", aliases: ["street_name", "street", "street name", "street name (en)", "street (en)"] },
    { key: "street_name_zh", label: "street_name_zh", type: "string", aliases: ["street_zh", "street name (zh)", "street (zh)", "街道"] },
    { key: "street_name_cn", label: "street_name_cn", type: "string", aliases: ["street_cn", "street name (cn)", "street (cn)"] },
    { key: "street_no", label: "street_no", type: "string", aliases: ["street_number", "street no", "street no.", "street number"] },
    { key: "address", label: "address", type: "string", aliases: ["full_address_en", "full_address", "full address"] },
    { key: "address_zh", label: "address_zh", type: "string", aliases: ["full_address_zh"] },
    { key: "address_cn", label: "address_cn", type: "string", aliases: ["full_address_cn"] },
    { key: "grade", label: "grade", type: "string" },
    { key: "title", label: "title", type: "string" },
    { key: "management_company_id", label: "management_company_id", type: "string" },
    { key: "management_company_name_en", label: "management_company_name_en", type: "string", lookupOnly: true },
    { key: "operator_company_id", label: "operator_company_id", type: "string" },
    { key: "operator_company_name_en", label: "operator_company_name_en", type: "string", lookupOnly: true },
    { key: "owner_company_id", label: "owner_company_id", type: "string" },
    { key: "owner_company_name_en", label: "owner_company_name_en", type: "string", lookupOnly: true },
    { key: "year_built", label: "year_built", type: "number", integer: true },
    { key: "no_of_floors", label: "no_of_floors", type: "number", integer: true, aliases: ["total_floors", "floor_count"] },
    { key: "building_area_sqft", label: "building_area_sqft", type: "number", aliases: ["bldg_area_sqft"] },
    { key: "building_area_sqm", label: "building_area_sqm", type: "number", aliases: ["bldg_area_sqm"] },
    { key: "mtr_station", label: "mtr_station", type: "string" },
    { key: "walking_minutes", label: "walking_minutes", type: "number", integer: true },
    { key: "lot_number", label: "lot_number", type: "string" },
    { key: "land_use", label: "land_use", type: "string" },
    { key: "class_of_site", label: "class_of_site", type: "string" },
    { key: "land_tenure", label: "land_tenure", type: "string" },
    { key: "plot_ratio", label: "plot_ratio", type: "number" },
    { key: "site_area_sqft", label: "site_area_sqft", type: "number" },
    { key: "site_area_sqm", label: "site_area_sqm", type: "number" },
    {
      key: "building_description_en",
      label: "building_description_en",
      type: "string",
      aliases: ["building_introduction", "description", "bldg_desc"],
    },
    { key: "building_description_zh", label: "building_description_zh", type: "string", aliases: ["bldg_desc_zh"] },
    { key: "building_description_cn", label: "building_description_cn", type: "string", aliases: ["bldg_desc_cn"] },
    { key: "location_advantages_en", label: "location_advantages_en", type: "string" },
    { key: "location_advantages_zh", label: "location_advantages_zh", type: "string" },
    { key: "location_advantages_cn", label: "location_advantages_cn", type: "string" },
    { key: "facilities_en", label: "facilities_en", type: "string", aliases: ["facilities"] },
    { key: "facilities_zh", label: "facilities_zh", type: "string" },
    { key: "facilities_cn", label: "facilities_cn", type: "string" },
    { key: "proposal_highlights_en", label: "proposal_highlights_en", type: "string" },
    { key: "proposal_highlights_zh", label: "proposal_highlights_zh", type: "string" },
    { key: "proposal_highlights_cn", label: "proposal_highlights_cn", type: "string" },
    { key: "building_relationships", label: "building_relationships", type: "json" },
    { key: "remarks", label: "remarks", type: "string", aliases: ["building_remarks", "notes"] },
    { key: "last_verified_date", label: "last_verified_date", type: "date" },
  ],

  async findById(id) {
    const raw = String(id).trim();
    const byBusinessId = await load("p.business_id = $1", [raw]);
    if (byBusinessId[0]) return byBusinessId[0];
    const byPropertyId = await load("p.property_id = $1", [raw]);
    return byPropertyId[0] ?? null;
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
    if (!patch.district_en) patch.district_en = v.district;
    if (!patch.city_en) patch.city_en = v.city ?? "Hong Kong";
    if (!patch.country) patch.country = v.country ?? "Hong Kong";
    const nameEn = String(patch.bldg_name_en ?? "").trim();
    if (!nameEn) throw new Error("building_name_en is required on create");
    const districtEn = String(patch.district_en ?? "").trim() || null;
    // building_id in CSV is the canonical B###### identity — never use it as property_id.
    const suppliedBuildingId = String(v.building_id ?? "").trim();
    const propertyId =
      suppliedBuildingId && !isPermanentBusinessId("building", suppliedBuildingId)
        ? suppliedBuildingId
        : await allocatePropertyV1Id();
    const businessId = isPermanentBusinessId("building", suppliedBuildingId)
      ? suppliedBuildingId
      : await allocateNextBusinessId("building");
    await query(
      `INSERT INTO properties_v1 (property_id, business_id, bldg_name_en, district_en, city_en, country)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        propertyId,
        businessId,
        nameEn,
        districtEn,
        patch.city_en ?? "Hong Kong",
        patch.country ?? "Hong Kong",
      ],
    );
    await registerBusinessId({
      entityType: "building",
      businessId,
      primaryRef: propertyId,
      deprecatedRef: propertyId,
    });
    await genericUpdateRecord("properties_v1", "property_id", propertyId, dbPatch(v), ctx);
    return propertyId;
  },

  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("properties_v1", "property_id", id, dbPatch(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(
      `SELECT ${SELECT} FROM ${FROM} ORDER BY building_name_en ASC NULLS LAST`,
    );
    return rows.map((r) =>
      withExportMatchIds(
        rowToRecord(r, String(r.building_id ?? r.building_pk), FIELD_KEYS).values,
        r.building_id,
        r.building_pk,
      ),
    );
  },
};
