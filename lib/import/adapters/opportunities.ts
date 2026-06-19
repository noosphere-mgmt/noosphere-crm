import { query } from "@/lib/db";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { companyExists, contactExists, validateFk } from "../fkValidation";
import { buildNaturalKeyParts } from "../matchRecord";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "opportunity_id",
  "external_ref",
  "opportunity_name",
  "lead_type",
  "sales_type",
  "sales_role",
  "usage_type",
  "status",
  "company_id",
  "contact_id",
  "opportunity_source",
  "district",
  "workspace_type",
  "desks",
  "area_sqft",
  "budget",
  "target_yield",
  "funding_status",
  "est_start_date",
  "move_in_date",
  "lease_term",
  "requirement_summary",
  "internal_remarks",
] as const;

const SELECT = `
  id::text AS opportunity_id,
  external_ref,
  client_name AS opportunity_name,
  lead_type,
  property_type AS sales_type,
  sales_role,
  property_type AS usage_type,
  status,
  company_id::text AS company_id,
  primary_contact_id::text AS contact_id,
  lead_source AS opportunity_source,
  district_preference AS district,
  workspace_type,
  required_capacity_pax AS desks,
  required_area_sqft::text AS area_sqft,
  budget_max::text AS budget,
  target_yield,
  funding_status,
  expected_close_date::text AS est_start_date,
  move_in_date::text AS move_in_date,
  lease_term,
  requirement_summary,
  remarks AS internal_remarks
`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if ("opportunity_name" in values) p.client_name = values.opportunity_name;
  if ("sales_type" in values) p.property_type = values.sales_type;
  if ("usage_type" in values && !("sales_type" in values)) p.property_type = values.usage_type;
  if ("contact_id" in values) p.primary_contact_id = values.contact_id;
  if ("opportunity_source" in values) p.lead_source = values.opportunity_source;
  if ("district" in values) p.district_preference = values.district;
  if ("desks" in values) p.required_capacity_pax = values.desks;
  if ("area_sqft" in values) p.required_area_sqft = values.area_sqft;
  if ("budget" in values) p.budget_max = values.budget;
  if ("est_start_date" in values) p.expected_close_date = values.est_start_date;
  if ("internal_remarks" in values) p.remarks = values.internal_remarks;
  for (const k of [
    "external_ref",
    "lead_type",
    "sales_role",
    "status",
    "company_id",
    "workspace_type",
    "target_yield",
    "funding_status",
    "move_in_date",
    "lease_term",
    "requirement_summary",
  ] as const) {
    if (k in values) p[k] = values[k];
  }
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM opportunities WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, Number.parseInt(String(row.opportunity_id), 10), FIELD_KEYS));
}

export const opportunitiesImportDefinition: ImportObjectDefinition = {
  objectType: "opportunities",
  tableName: "opportunities",
  matchIdField: "opportunity_id",
  idType: "number",

  fields: FIELD_KEYS.map((key) => ({
    key,
    label: key,
    type: key.includes("date") ? "date" : key === "desks" || key === "area_sqft" || key === "budget" ? "number" : "string",
    matchOnly: key === "opportunity_id",
    requiredOnCreate: key === "opportunity_name" ? true : undefined,
    aliases: key === "opportunity_id" ? ["id"] : undefined,
  })),

  async findById(id) {
    const rows = await load("id = $1", [Number(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef(externalRef) {
    return load("external_ref = $1", [externalRef.trim()]);
  },

  buildNaturalKey(values) {
    const name = String(values.opportunity_name ?? "").trim();
    const companyId = String(values.company_id ?? "").trim();
    if (!name) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([name, companyId]) };
  },

  async findByNaturalKey(key) {
    const [name, companyId] = key.split("|");
    const rows = await query<{ id: string }>(
      `SELECT id::text FROM opportunities
       WHERE lower(trim(client_name)) = $1
         AND ($2 = '' OR company_id = $3::bigint)`,
      [name, companyId ?? "", companyId ? Number.parseInt(companyId, 10) : 0],
    );
    if (rows.length === 0) return [];
    return load(`id = ANY($1::bigint[])`, [rows.map((r) => Number.parseInt(r.id, 10))]);
  },

  async validateReferences(values, suppliedFields, existing) {
    const errors: string[] = [];
    for (const [field, check] of [
      ["company_id", companyExists],
      ["contact_id", contactExists],
    ] as const) {
      if (suppliedFields.has(field)) {
        const err = await validateFk(field, values[field], check);
        if (err) errors.push(err);
      }
    }
    return errors;
  },

  async createRecord(values, ctx) {
    const v = applySessionMetadata(dbPatch(values), ctx);
    const rows = await query<{ id: string }>(
      `INSERT INTO opportunities (
         client_name, lead_type, sales_role, property_type, status,
         company_id, primary_contact_id, lead_source, district_preference,
         workspace_type, required_capacity_pax, required_area_sqft, budget_max,
         target_yield, funding_status, expected_close_date, move_in_date,
         lease_term, requirement_summary, remarks, external_ref, import_run_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING id::text`,
      [
        v.client_name ?? values.opportunity_name ?? "",
        v.lead_type ?? "direct_client",
        v.sales_role ?? "to_lease",
        v.property_type ?? null,
        v.status ?? "new",
        v.company_id ?? null,
        v.primary_contact_id ?? null,
        v.lead_source ?? null,
        v.district_preference ?? null,
        v.workspace_type ?? null,
        v.required_capacity_pax ?? null,
        v.required_area_sqft ?? null,
        v.budget_max ?? null,
        v.target_yield ?? null,
        v.funding_status ?? null,
        v.expected_close_date ?? null,
        v.move_in_date ?? null,
        v.lease_term ?? null,
        v.requirement_summary ?? null,
        v.remarks ?? null,
        v.external_ref ?? null,
        v.import_run_id ?? null,
      ],
    );
    return Number.parseInt(rows[0]!.id, 10);
  },

  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("opportunities", "id", id, dbPatch(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM opportunities ORDER BY updated_at DESC`);
    return rows.map((r) => rowToRecord(r, Number.parseInt(String(r.opportunity_id), 10), FIELD_KEYS).values);
  },
};
