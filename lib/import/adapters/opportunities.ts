import { query } from "@/lib/db";
import { sqlContactDisplayName } from "@/lib/contactName";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { parseBigIntParam } from "../fkValidation";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import { sqlJoinLegacyCompany, sqlJoinLegacyContact } from "../lookupSql";
import {
  mergeReferenceResults,
  resolveContactIdOrName,
  resolveLegacyCompanyIdOrName,
} from "../referenceResolution";
import type { ImportFieldDef, ImportObjectDefinition } from "../objectRegistry";
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
  "company_name_en",
  "assigned_contact_id",
  "assigned_contact_name",
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
  o.id::text AS opportunity_id,
  o.external_ref,
  o.client_name AS opportunity_name,
  o.lead_type,
  o.property_type AS sales_type,
  o.sales_role,
  o.property_type AS usage_type,
  o.status,
  o.company_id::text AS company_id,
  c.company_name AS company_name_en,
  o.primary_contact_id::text AS assigned_contact_id,
  ${sqlContactDisplayName("ct")} AS assigned_contact_name,
  o.lead_source AS opportunity_source,
  o.district_preference AS district,
  o.workspace_type,
  o.required_capacity_pax AS desks,
  o.required_area_sqft::text AS area_sqft,
  o.budget_max::text AS budget,
  o.target_yield,
  o.funding_status,
  o.expected_close_date::text AS est_start_date,
  o.move_in_date::text AS move_in_date,
  o.lease_term,
  o.requirement_summary,
  o.remarks AS internal_remarks
`;

const FROM = `
  opportunities o
  LEFT JOIN companies c ON ${sqlJoinLegacyCompany("c", "o.company_id")}
  LEFT JOIN contacts ct ON ${sqlJoinLegacyContact("ct", "o.primary_contact_id")}
`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if ("opportunity_name" in values) p.client_name = values.opportunity_name;
  if ("sales_type" in values) p.property_type = values.sales_type;
  if ("usage_type" in values && !("sales_type" in values)) p.property_type = values.usage_type;
  if ("assigned_contact_id" in values) p.primary_contact_id = values.assigned_contact_id;
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
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, Number.parseInt(String(row.opportunity_id), 10), FIELD_KEYS));
}

function opportunityFieldDef(key: (typeof FIELD_KEYS)[number]): ImportFieldDef {
  const base = { key, label: key };
  if (key === "opportunity_id") {
    return { ...base, type: "number", integer: true, matchOnly: true, aliases: ["id"] };
  }
  if (key === "company_name_en") {
    return { ...base, type: "string", lookupOnly: true, aliases: ["company_name"] };
  }
  if (key === "assigned_contact_name") {
    return { ...base, type: "string", lookupOnly: true, aliases: ["contact_name"] };
  }
  if (key === "opportunity_name") {
    return { ...base, type: "string", requiredOnCreate: true };
  }
  if (key === "assigned_contact_id") {
    return { ...base, type: "string", aliases: ["contact_id", "primary_contact_id"] };
  }
  if (key.includes("date")) return { ...base, type: "date" };
  if (key === "desks" || key === "area_sqft" || key === "budget") return { ...base, type: "number" };
  return { ...base, type: "string" };
}

export const opportunitiesImportDefinition: ImportObjectDefinition = {
  objectType: "opportunities",
  tableName: "opportunities",
  matchIdField: "opportunity_id",
  idType: "number",

  fields: FIELD_KEYS.map((key) => opportunityFieldDef(key)),

  async findById(id) {
    const rows = await load("o.id = $1", [Number(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef(externalRef) {
    return load("o.external_ref = $1", [externalRef.trim()]);
  },

  buildNaturalKey(values) {
    const name = String(values.opportunity_name ?? "").trim();
    const companyId = String(values.company_id ?? "").trim();
    if (!name) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([name, companyId]) };
  },

  async findByNaturalKey(key) {
    const parts = splitNaturalKeyParts(key, 2);
    if (!parts) return [];
    const [name, companyId] = parts;
    const trimmedCompany = companyId ?? "";
    const companyIdNum = parseBigIntParam(trimmedCompany);
    if (trimmedCompany && companyIdNum == null) return [];
    const rows = await query<{ id: string }>(
      `SELECT id::text FROM opportunities
       WHERE lower(trim(client_name)) = $1
         AND ($2 = '' OR company_id = $3::bigint)`,
      [name, trimmedCompany, companyIdNum ?? 0],
    );
    if (rows.length === 0) return [];
    return load(`o.id = ANY($1::bigint[])`, [rows.map((r) => Number.parseInt(r.id, 10))]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    const results = [];
    if (
      suppliedFields.has("company_id") ||
      "company_id" in writable ||
      suppliedFields.has("company_name_en")
    ) {
      results.push(
        await resolveLegacyCompanyIdOrName(
          "company_id",
          "company_name_en",
          values,
          suppliedFields,
          existing,
          writable,
          false,
        ),
      );
    }
    if (
      suppliedFields.has("assigned_contact_id") ||
      "assigned_contact_id" in writable ||
      suppliedFields.has("assigned_contact_name") ||
      "contact_id" in writable
    ) {
      const contactValues = { ...values };
      if (contactValues.contact_id != null && contactValues.assigned_contact_id == null) {
        contactValues.assigned_contact_id = contactValues.contact_id;
      }
      const contactWritable = { ...writable };
      if (contactWritable.contact_id != null && contactWritable.assigned_contact_id == null) {
        contactWritable.assigned_contact_id = contactWritable.contact_id;
      }
      const contactSupplied = new Set(suppliedFields);
      if (contactSupplied.has("contact_id")) contactSupplied.add("assigned_contact_id");
      results.push(
        await resolveContactIdOrName(
          "assigned_contact_id",
          "assigned_contact_name",
          contactValues,
          contactSupplied,
          existing,
          contactWritable,
          false,
        ),
      );
    }
    return mergeReferenceResults(...results);
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
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} ORDER BY o.updated_at DESC`);
    return rows.map((r) => rowToRecord(r, Number.parseInt(String(r.opportunity_id), 10), FIELD_KEYS).values);
  },
};
