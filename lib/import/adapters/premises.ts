import { query } from "@/lib/db";
import { createPremisesV1 } from "@/lib/repos/premisesV1";
import { sqlJoinV1Company } from "../lookupSql";
import { genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import {
  mergeReferenceResults,
  resolveBuildingIdOrName,
  resolveCompanyV1IdOrName,
} from "../referenceResolution";
import type { ImportFieldDef, ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord, RecordId } from "../types";

const FIELD_KEYS = [
  "premises_id",
  "external_ref",
  "building_id",
  "building_name_en",
  "operator_company_id",
  "operator_company_name_en",
  "owner_company_id",
  "owner_company_name_en",
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
  pm.business_id AS premises_id,
  pm.external_ref,
  b.business_id AS building_id,
  b.bldg_name_en AS building_name_en,
  pm.operator_company_id,
  opco.company_name_en AS operator_company_name_en,
  pm.owner_company_id,
  own.company_name_en AS owner_company_name_en,
  pm.office_name AS premises_name,
  pm.floor, pm.unit, pm.property_type, pm.office_type,
  pm.offer_type AS listing_intent,
  pm.offer_status AS listing_status,
  pm.source_file AS inventory_source,
  pm.operating_model,
  pm.fit_out_condition AS fit_out,
  pm.view_type AS view,
  pm.workstation_count AS desks,
  pm.gross_area_sqft::text AS gross_area_sqft,
  pm.net_area_sqft::text AS net_area_sqft,
  pm.asking_sale_price::text AS asking_price,
  pm.sale_price_psf::text AS asking_price_psf,
  pm.monthly_rent::text AS package_monthly_fee,
  pm.management_fee::text AS management_fee,
  pm.government_rates::text AS government_rates,
  pm.deposit_months AS deposit,
  pm.rent_free_period,
  pm.contract_term_months AS contract_term,
  pm.available_date::text AS available_date,
  pm.last_verified_date::text AS last_verified_date,
  pm.expected_commission::text AS commission_expected,
  pm.payout_commission::text AS commission_payout,
  pm.commission_remarks,
  pm.listing_remarks AS internal_remarks
`;

const FROM = `
  premises_v1 pm
  LEFT JOIN properties_v1 b ON b.property_id = pm.property_id
  LEFT JOIN companies_v1 opco ON ${sqlJoinV1Company("opco", "pm.operator_company_id")}
  LEFT JOIN companies_v1 own ON ${sqlJoinV1Company("own", "pm.owner_company_id")}
`;

const PREMISES_DB_COLUMNS = new Set([
  "property_id",
  "external_ref",
  "office_name",
  "floor",
  "unit",
  "property_type",
  "office_type",
  "offer_type",
  "offer_status",
  "source_file",
  "operating_model",
  "fit_out_condition",
  "view_type",
  "workstation_count",
  "gross_area_sqft",
  "net_area_sqft",
  "asking_sale_price",
  "sale_price_psf",
  "monthly_rent",
  "management_fee",
  "government_rates",
  "deposit_months",
  "rent_free_period",
  "contract_term_months",
  "available_date",
  "last_verified_date",
  "expected_commission",
  "payout_commission",
  "commission_remarks",
  "listing_remarks",
  "operator_company_id",
  "owner_company_id",
  "import_run_id",
]);

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
  /** Import session fields — stored on import_runs, not premises_v1 (except import_run_id). */
  const skipKeys = new Set([
    "premises_id",
    "building_id",
    "building_name_en",
    "source_system",
    "source_date",
    "source_file",
  ]);
  const p: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (skipKeys.has(k) || k.endsWith("_name_en") || k === "premises_name") continue;
    const col = map[k] ?? k;
    if (!PREMISES_DB_COLUMNS.has(col)) continue;
    if (v === "" || v === null) {
      p[col] = null;
      continue;
    }
    p[col] = v;
  }
  if ("building_id" in values) {
    const propertyId = String(values.building_id ?? "").trim();
    if (propertyId) p.property_id = propertyId;
  }
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, String(row.premises_id), FIELD_KEYS));
}

function premiseFieldDef(key: (typeof FIELD_KEYS)[number]): ImportFieldDef {
  const base = { key, label: key };
  if (key === "premises_id") {
    return { ...base, type: "string", matchOnly: true };
  }
  if (key === "building_name_en" || key === "operator_company_name_en" || key === "owner_company_name_en") {
    return { ...base, type: "string", lookupOnly: true };
  }
  if (key === "building_id") {
    return { ...base, type: "string", aliases: ["property_id"] };
  }
  if (key.includes("date")) return { ...base, type: "date" };
  if (
    key.includes("area") ||
    key.includes("price") ||
    key.includes("fee") ||
    key.includes("commission") ||
    key === "desks" ||
    key === "deposit" ||
    key === "contract_term"
  ) {
    return { ...base, type: "number" };
  }
  return { ...base, type: "string" };
}

export const premisesImportDefinition: ImportObjectDefinition = {
  objectType: "premises",
  tableName: "premises_v1",
  matchIdField: "premises_id",
  idType: "text",

  fields: FIELD_KEYS.map((key) => premiseFieldDef(key)),

  async prepareMatchValues(values, suppliedFields) {
    if (!suppliedFields.has("building_name_en") && !suppliedFields.has("building_id")) {
      return values;
    }
    const result = await resolveBuildingIdOrName(
      "building_id",
      "building_name_en",
      values,
      suppliedFields,
      null,
      {},
      false,
    );
    return { ...values, ...result.writablePatches };
  },

  async findById(id) {
    const rows = await load("pm.premises_id = $1", [String(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef(externalRef) {
    return load("pm.external_ref = $1", [externalRef.trim()]);
  },

  buildNaturalKey(values) {
    const building = String(values.building_id ?? "").trim();
    const floor = String(values.floor ?? "").trim();
    const unit = String(values.unit ?? "").trim();
    if (!building) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([building, floor, unit]) };
  },

  async findByNaturalKey(key) {
    const parts = splitNaturalKeyParts(key, 3);
    if (!parts) return [];
    const [building, floor, unit] = parts;
    const rows = await query<{ premises_id: string }>(
      `SELECT premises_id FROM premises_v1
       WHERE property_id = $1
         AND lower(trim(coalesce(floor, ''))) = $2
         AND lower(trim(coalesce(unit, ''))) = $3`,
      [building, floor ?? "", unit ?? ""],
    );
    if (rows.length === 0) return [];
    return load(`pm.premises_id = ANY($1::text[])`, [rows.map((r) => r.premises_id)]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    const results = [
      await resolveBuildingIdOrName(
        "building_id",
        "building_name_en",
        values,
        suppliedFields,
        existing,
        writable,
        true,
      ),
    ];
    const companyRefs = [
      ["operator_company_id", "operator_company_name_en"],
      ["owner_company_id", "owner_company_name_en"],
    ] as const;
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
    const propertyId = String(values.building_id ?? values.property_id ?? "").trim();
    if (!propertyId) {
      throw new Error("building_id is required — provide building_id or building_name_en");
    }
    const patch = dbPatch({ ...values, building_id: propertyId });
    delete patch.property_id;
    if (ctx.importRunId) patch.import_run_id = ctx.importRunId;
    return createPremisesV1(propertyId, patch as Parameters<typeof createPremisesV1>[1]);
  },

  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("premises_v1", "premises_id", id, dbPatch(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} ORDER BY pm.premises_id ASC`);
    return rows.map((r) => rowToRecord(r, String(r.premises_id), FIELD_KEYS).values);
  },
};
