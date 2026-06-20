import { query } from "@/lib/db";
import { createPremisesV1, getPremisesV1 } from "@/lib/repos/premisesV1";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { buildNaturalKeyParts } from "../matchRecord";
import {
  mergeReferenceResults,
  resolveBuildingReference,
  resolveCompanyV1Reference,
} from "../referenceResolution";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord, RecordId } from "../types";

const FIELD_KEYS = [
  "premises_id",
  "external_ref",
  "building_id",
  "operator_company_id",
  "owner_company_id",
  "premises_name",
  "floor",
  "unit",
  "property_type",
  "office_type",
  "listing_intent",
  "listing_status",
  "inventory_source",
  "operating_model",
  "fit_out",
  "view",
  "desks",
  "gross_area_sqft",
  "net_area_sqft",
  "asking_price",
  "asking_price_psf",
  "package_monthly_fee",
  "management_fee",
  "government_rates",
  "deposit",
  "rent_free_period",
  "contract_term",
  "available_date",
  "last_verified_date",
  "commission_expected",
  "commission_payout",
  "commission_remarks",
  "internal_remarks",
] as const;

const SELECT = `
  premises_id,
  external_ref,
  property_id AS building_id,
  operator_company_id,
  owner_company_id,
  office_name AS premises_name,
  floor, unit, property_type, office_type,
  offer_type AS listing_intent,
  offer_status AS listing_status,
  source_file AS inventory_source,
  operating_model,
  fit_out_condition AS fit_out,
  view_type AS view,
  workstation_count AS desks,
  gross_area_sqft::text AS gross_area_sqft,
  net_area_sqft::text AS net_area_sqft,
  asking_sale_price::text AS asking_price,
  sale_price_psf::text AS asking_price_psf,
  monthly_rent::text AS package_monthly_fee,
  management_fee::text AS management_fee,
  government_rates::text AS government_rates,
  deposit_months AS deposit,
  rent_free_period,
  contract_term_months AS contract_term,
  available_date::text AS available_date,
  last_verified_date::text AS last_verified_date,
  expected_commission::text AS commission_expected,
  payout_commission::text AS commission_payout,
  commission_remarks,
  listing_remarks AS internal_remarks
`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const map: Record<string, string> = {
    building_id: "property_id",
    premises_name: "office_name",
    listing_intent: "offer_type",
    listing_status: "offer_status",
    inventory_source: "source_file",
    fit_out: "fit_out_condition",
    view: "view_type",
    desks: "workstation_count",
    asking_price: "asking_sale_price",
    asking_price_psf: "sale_price_psf",
    package_monthly_fee: "monthly_rent",
    contract_term: "contract_term_months",
    commission_expected: "expected_commission",
    commission_payout: "payout_commission",
    internal_remarks: "listing_remarks",
  };
  const p: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (k === "premises_id" || k === "building_id") continue;
    const col = map[k] ?? k;
    p[col] = v;
  }
  if ("building_id" in values) p.property_id = values.building_id;
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM premises_v1 WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, String(row.premises_id), FIELD_KEYS));
}

export const premisesImportDefinition: ImportObjectDefinition = {
  objectType: "premises",
  tableName: "premises_v1",
  matchIdField: "premises_id",
  idType: "text",

  fields: FIELD_KEYS.map((key) => ({
    key,
    label: key,
    type: key.includes("date") ? "date" : key.includes("area") || key.includes("price") || key.includes("fee") || key.includes("commission") || key === "desks" || key === "deposit" || key === "contract_term" ? "number" : "string",
    matchOnly: key === "premises_id",
    requiredOnCreate: key === "building_id" ? true : undefined,
    aliases: key === "building_id" ? ["property_id"] : undefined,
  })),

  async findById(id) {
    const rows = await load("premises_id = $1", [String(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef(externalRef) {
    return load("external_ref = $1", [externalRef.trim()]);
  },

  buildNaturalKey(values) {
    const building = String(values.building_id ?? "").trim();
    const floor = String(values.floor ?? "").trim();
    const unit = String(values.unit ?? "").trim();
    if (!building) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([building, floor, unit]) };
  },

  async findByNaturalKey(key) {
    const [building, floor, unit] = key.split("|");
    const rows = await query<{ premises_id: string }>(
      `SELECT premises_id FROM premises_v1
       WHERE property_id = $1
         AND lower(trim(coalesce(floor, ''))) = $2
         AND lower(trim(coalesce(unit, ''))) = $3`,
      [building, floor ?? "", unit ?? ""],
    );
    if (rows.length === 0) return [];
    return load(`premises_id = ANY($1::text[])`, [rows.map((r) => r.premises_id)]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    const buildingRaw = suppliedFields.has("building_id")
      ? values.building_id
      : existing?.values.building_id ?? writable.building_id;
    const results = [
      await resolveBuildingReference("building_id", buildingRaw, true),
      ...(suppliedFields.has("operator_company_id") || "operator_company_id" in writable
        ? [await resolveCompanyV1Reference("operator_company_id", values.operator_company_id ?? writable.operator_company_id, false)]
        : []),
      ...(suppliedFields.has("owner_company_id") || "owner_company_id" in writable
        ? [await resolveCompanyV1Reference("owner_company_id", values.owner_company_id ?? writable.owner_company_id, false)]
        : []),
    ];
    return mergeReferenceResults(...results);
  },

  async createRecord(values, ctx) {
    const v = applySessionMetadata(values, ctx);
    const propertyId = String(v.building_id ?? "").trim();
    if (!propertyId) throw new Error("building_id is required");
    const patch = dbPatch(v);
    return createPremisesV1(propertyId, patch as Parameters<typeof createPremisesV1>[1]);
  },

  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("premises_v1", "premises_id", id, dbPatch(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM premises_v1 ORDER BY premises_id ASC`);
    return rows.map((r) => rowToRecord(r, String(r.premises_id), FIELD_KEYS).values);
  },
};
