import { query } from "@/lib/db";
import { allocateNextBusinessId, ensureLegacyBusinessId, registerBusinessId } from "@/lib/businessIdResolve";
import { isPermanentBusinessId } from "@/lib/businessIds";
import { sqlContactDisplayName } from "@/lib/contactName";
import {
  normalizeCategoryPreference,
  normalizeSpaceFormPreference,
} from "@/lib/opportunityPreferences";
import { normalizeOpportunityStatus } from "@/lib/opportunityStatusModel";
import { normalizeOpportunitySource, OPPORTUNITY_SOURCES } from "@/lib/opportunitySourceValues";
import { OPPORTUNITY_STATUSES } from "@/lib/opportunityStatusModel";
import {
  normalizeOpportunitySalesRole,
  OPPORTUNITY_SALES_ROLES,
} from "@/lib/opportunityValues";
import { resolveCompanyRefToLegacy, resolveOpportunityRefToLegacy } from "@/lib/crmRefResolve";
import { applySessionMetadata, genericUpdateRecord, rowToRecord, withExportMatchIds } from "../adapterUtils";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import { sqlExportCompanyId, sqlExportContactId, sqlExportOpportunityId, sqlJoinLegacyCompany, sqlJoinLegacyContact } from "../lookupSql";
import {
  mergeReferenceResults,
  resolveContactIdOrName,
  resolveLegacyCompanyIdOrName,
} from "../referenceResolution";
import type { ImportFieldDef, ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

/** Column order follows Opportunity UI (create + detail), then legacy import-only keys. */
const FIELD_KEYS = [
  // Identity
  "opportunity_id",
  "external_ref",
  // Referrer & Admin
  "referrer_company_id",
  "referrer_company_name_en",
  "referrer_contact_id",
  "referrer_contact_name",
  "relationship_owner",
  // Opportunity
  "opportunity_name",
  "company_id",
  "company_name_en",
  "assigned_contact_id",
  "assigned_contact_name",
  "opportunity_source",
  "sales_role",
  "status",
  "lost_reason",
  // Requirement
  "property_category_preference",
  "property_type_preference",
  "district",
  "required_area_sqft",
  "required_capacity_pax",
  "budget_max",
  "budget_min",
  "expected_close_date",
  "move_in_date",
  "lease_term",
  "target_yield",
  "funding_status",
  "requirement_summary",
  // Situation + Notes
  "waiting_for",
  "next_action",
  "next_action_date",
  "internal_remarks",
  // Legacy / removed-from-UI (importable, hidden from template/export)
  "lead_type",
  "sales_type",
  "usage_type",
  "workspace_type",
  "desks",
  "area_sqft",
  "budget",
  "est_start_date",
] as const;

const SELECT = `
  o.id::text AS legacy_id,
  ${sqlExportOpportunityId("o.id")} AS opportunity_id,
  o.external_ref,
  ${sqlExportCompanyId("o.referrer_company_id")} AS referrer_company_id,
  rc.company_name AS referrer_company_name_en,
  CASE WHEN o.referrer_contact_id IS NULL THEN NULL ELSE ${sqlExportContactId("o.referrer_contact_id")} END AS referrer_contact_id,
  ${sqlContactDisplayName("rct")} AS referrer_contact_name,
  o.relationship_owner,
  o.client_name AS opportunity_name,
  ${sqlExportCompanyId("o.company_id")} AS company_id,
  c.company_name AS company_name_en,
  CASE WHEN o.primary_contact_id IS NULL THEN NULL
       ELSE ${sqlExportContactId("o.primary_contact_id")} END AS assigned_contact_id,
  ${sqlContactDisplayName("ct")} AS assigned_contact_name,
  o.lead_source AS opportunity_source,
  o.sales_role,
  o.status,
  o.lost_reason,
  o.property_category_preference,
  o.property_type_preference,
  o.district_preference AS district,
  o.required_area_sqft::text AS required_area_sqft,
  o.required_capacity_pax,
  o.budget_max::text AS budget_max,
  o.budget_min::text AS budget_min,
  o.expected_close_date::text AS expected_close_date,
  o.move_in_date::text AS move_in_date,
  o.lease_term,
  o.target_yield,
  o.funding_status,
  o.requirement_summary,
  o.waiting_for,
  o.next_action,
  o.next_action_date::text AS next_action_date,
  o.remarks AS internal_remarks,
  o.lead_type,
  o.property_type AS sales_type,
  o.property_type AS usage_type,
  o.workspace_type,
  o.required_capacity_pax AS desks,
  o.required_area_sqft::text AS area_sqft,
  o.budget_max::text AS budget,
  o.expected_close_date::text AS est_start_date
`;

const FROM = `
  opportunities o
  LEFT JOIN companies c ON ${sqlJoinLegacyCompany("c", "o.company_id")}
  LEFT JOIN contacts ct ON ${sqlJoinLegacyContact("ct", "o.primary_contact_id")}
  LEFT JOIN companies rc ON ${sqlJoinLegacyCompany("rc", "o.referrer_company_id")}
  LEFT JOIN contacts rct ON ${sqlJoinLegacyContact("rct", "o.referrer_contact_id")}
`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if ("opportunity_name" in values) p.client_name = values.opportunity_name;
  if ("sales_type" in values) p.property_type = values.sales_type;
  if ("usage_type" in values && !("sales_type" in values)) p.property_type = values.usage_type;
  if ("assigned_contact_id" in values) p.primary_contact_id = values.assigned_contact_id;
  if ("contact_id" in values) p.primary_contact_id = values.contact_id;
  if ("opportunity_source" in values) p.lead_source = normalizeOpportunitySource(values.opportunity_source);
  if ("district" in values) p.district_preference = values.district;
  if ("property_category_preference" in values) {
    p.property_category_preference = normalizeCategoryPreference(values.property_category_preference);
  }
  if ("property_type_preference" in values) {
    p.property_type_preference = normalizeSpaceFormPreference(values.property_type_preference);
  }
  if ("desks" in values) p.required_capacity_pax = values.desks;
  if ("required_capacity_pax" in values) p.required_capacity_pax = values.required_capacity_pax;
  if ("area_sqft" in values) p.required_area_sqft = values.area_sqft;
  if ("required_area_sqft" in values) p.required_area_sqft = values.required_area_sqft;
  if ("budget" in values) p.budget_max = values.budget;
  if ("budget_min" in values) p.budget_min = values.budget_min;
  if ("budget_max" in values) p.budget_max = values.budget_max;
  if ("est_start_date" in values) p.expected_close_date = values.est_start_date;
  if ("expected_close_date" in values) p.expected_close_date = values.expected_close_date;
  if ("internal_remarks" in values) p.remarks = values.internal_remarks;
  if ("status" in values && values.status != null) {
    p.status = normalizeOpportunityStatus(String(values.status));
  }
  if ("waiting_for" in values) p.waiting_for = values.waiting_for;
  if ("next_action" in values) p.next_action = values.next_action;
  if ("next_action_date" in values) p.next_action_date = values.next_action_date;
  if ("sales_role" in values) {
    p.sales_role = normalizeOpportunitySalesRole(
      values.sales_role == null ? "" : String(values.sales_role),
    );
  }
  for (const k of [
    "external_ref",
    "lead_type",
    "company_id",
    "workspace_type",
    "target_yield",
    "funding_status",
    "move_in_date",
    "lease_term",
    "requirement_summary",
    "lost_reason",
    "relationship_owner",
    "referrer_company_id",
    "referrer_contact_id",
  ] as const) {
    if (k in values) p[k] = values[k];
  }
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, Number.parseInt(String(row.legacy_id), 10), FIELD_KEYS));
}

const FIELD_LABELS: Partial<Record<(typeof FIELD_KEYS)[number], string>> = {
  opportunity_id: "Opportunity ID",
  external_ref: "External Ref",
  referrer_company_id: "Referrer Company",
  referrer_company_name_en: "Referrer Company Name",
  referrer_contact_id: "Referrer Contact",
  referrer_contact_name: "Referrer Contact Name",
  relationship_owner: "Relationship Owner",
  opportunity_name: "Opportunity Name",
  company_id: "Company",
  company_name_en: "Company Name",
  assigned_contact_id: "Contact",
  assigned_contact_name: "Contact Name",
  opportunity_source: "Lead/Opp Source",
  sales_role: "Sales Role",
  status: "Status",
  lost_reason: "Outcome Reason",
  property_category_preference: "Required Type",
  property_type_preference: "Required Subtype",
  district: "District",
  required_area_sqft: "Area (Sq Ft)",
  required_capacity_pax: "Capacity",
  budget_max: "Budget (HKD)",
  budget_min: "Budget Min (HKD)",
  expected_close_date: "Expected Close",
  move_in_date: "Move-In Date",
  lease_term: "Lease Term",
  target_yield: "Target Yield (%)",
  funding_status: "Funding Status",
  requirement_summary: "Requirement Summary",
  waiting_for: "Waiting For",
  next_action: "Next Action",
  next_action_date: "Next Action Date",
  internal_remarks: "Internal Remarks",
};

function opportunityFieldDef(key: (typeof FIELD_KEYS)[number]): ImportFieldDef {
  const base = { key, label: FIELD_LABELS[key] ?? key };
  // Legacy / removed-from-UI columns — keep importable, hide from template/export.
  if (
    [
      "lead_type",
      "sales_type",
      "usage_type",
      "workspace_type",
      "desks",
      "area_sqft",
      "budget",
      "est_start_date",
    ].includes(key)
  ) {
    return {
      ...base,
      type: key.includes("date") ? "date" : ["desks", "area_sqft", "budget"].includes(key) ? "number" : "string",
      exportHidden: true,
    };
  }
  if (key === "opportunity_id") {
    return { ...base, type: "string", matchOnly: true, aliases: ["id", "business_id"] };
  }
  if (key === "company_name_en") {
    return { ...base, type: "string", lookupOnly: true, aliases: ["company_name"] };
  }
  if (key === "assigned_contact_name") {
    return { ...base, type: "string", lookupOnly: true, aliases: ["contact_name"] };
  }
  if (key === "referrer_company_name_en" || key === "referrer_contact_name") {
    return { ...base, type: "string", lookupOnly: true };
  }
  if (key === "opportunity_name") {
    return { ...base, type: "string", requiredOnCreate: true, aliases: ["client_name", "name"] };
  }
  if (key === "opportunity_source") {
    return {
      ...base,
      type: "enum",
      enumValues: [...OPPORTUNITY_SOURCES],
      defaultValue: "direct",
      aliases: ["lead_source"],
    };
  }
  if (key === "district") {
    return { ...base, type: "string", aliases: ["district_preference"] };
  }
  if (key === "property_category_preference") {
    return { ...base, type: "string", aliases: ["required_type", "asset_class"], defaultValue: "commercial" };
  }
  if (key === "property_type_preference") {
    return { ...base, type: "string", aliases: ["required_subtype", "product_subtype", "space_form"] };
  }
  if (key === "internal_remarks") {
    return { ...base, type: "string", aliases: ["remarks", "notes"] };
  }
  if (key === "assigned_contact_id") {
    return { ...base, type: "string", aliases: ["contact_id", "primary_contact_id"] };
  }
  if (key === "status") return { ...base, type: "enum", enumValues: [...OPPORTUNITY_STATUSES] };
  if (key === "sales_role") {
    return {
      ...base,
      type: "enum",
      enumValues: [...OPPORTUNITY_SALES_ROLES],
      defaultValue: "to_lease",
      aliases: ["prof_service"],
    };
  }
  if (key.includes("date")) return { ...base, type: "date" };
  if (["required_capacity_pax", "required_area_sqft", "budget_min", "budget_max"].includes(key)) {
    return { ...base, type: "number" };
  }
  return { ...base, type: "string" };
}

export const opportunitiesImportDefinition: ImportObjectDefinition = {
  objectType: "opportunities",
  tableName: "opportunities",
  matchIdField: "opportunity_id",
  idType: "text",

  fields: FIELD_KEYS.map((key) => opportunityFieldDef(key)),

  async findById(id) {
    const legacyId = await resolveOpportunityRefToLegacy(id);
    if (legacyId == null) return null;
    const rows = await load("o.id = $1", [legacyId]);
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
    const trimmedName = (name ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
    const trimmedCompany = companyId ?? "";
    let companyIdNum: number | null = null;
    if (trimmedCompany) {
      companyIdNum = await resolveCompanyRefToLegacy(trimmedCompany);
      if (companyIdNum == null) return [];
    }
    const rows = await query<{ id: string }>(
      `SELECT id::text FROM opportunities
       WHERE (
           lower(trim(both from client_name)) = lower($1)
           OR trim(both from client_name) = $1
         )
         AND ($2 = '' OR company_id = $3::bigint)`,
      [trimmedName, trimmedCompany, companyIdNum ?? 0],
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
    if (suppliedFields.has("referrer_company_id") || suppliedFields.has("referrer_company_name_en") || "referrer_company_id" in writable) {
      results.push(await resolveLegacyCompanyIdOrName("referrer_company_id", "referrer_company_name_en", values, suppliedFields, existing, writable, false));
    }
    if (suppliedFields.has("referrer_contact_id") || suppliedFields.has("referrer_contact_name") || "referrer_contact_id" in writable) {
      results.push(await resolveContactIdOrName("referrer_contact_id", "referrer_contact_name", values, suppliedFields, existing, writable, false));
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
    const suppliedOpportunityId = String(values.opportunity_id ?? "").trim();
    const businessId = isPermanentBusinessId("opportunity", suppliedOpportunityId)
      ? suppliedOpportunityId
      : await allocateNextBusinessId("opportunity");
    const rows = await query<{ id: string }>(
      `INSERT INTO opportunities (
         client_name, lead_type, sales_role, property_type, status,
         company_id, primary_contact_id, lead_source, district_preference,
         property_category_preference, property_type_preference,
         workspace_type, required_capacity_pax, required_area_sqft, budget_max,
         target_yield, funding_status, expected_close_date, move_in_date,
         lease_term, requirement_summary, remarks, external_ref, import_run_id,
         business_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING id::text`,
      [
        v.client_name ?? values.opportunity_name ?? "",
        v.lead_type ?? "direct_client",
        v.sales_role ?? "to_lease",
        v.property_type ?? null,
        v.status ? normalizeOpportunityStatus(String(v.status)) : "qualifying",
        v.company_id ?? null,
        v.primary_contact_id ?? null,
        v.lead_source ?? null,
        v.district_preference ?? null,
        v.property_category_preference ?? null,
        v.property_type_preference ?? null,
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
        businessId,
      ],
    );
    const id = Number.parseInt(rows[0]!.id, 10);
    await registerBusinessId({
      entityType: "opportunity",
      businessId,
      primaryRef: String(id),
      legacyNumeric: id,
    });
    const extra = dbPatch(values);
    for (const key of ["budget_min", "lost_reason", "relationship_owner", "referrer_company_id", "referrer_contact_id", "waiting_for", "next_action", "next_action_date"]) {
      if (!(key in extra)) continue;
      await genericUpdateRecord("opportunities", "id", id, { [key]: extra[key] }, ctx);
    }
    return id;
  },

  async updateRecord(id, patch, ctx) {
    const legacyId = typeof id === "number" ? id : Number.parseInt(String(id), 10);
    await genericUpdateRecord("opportunities", "id", legacyId, dbPatch(patch), ctx);
    await ensureLegacyBusinessId("opportunity", legacyId);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} ORDER BY o.updated_at DESC`);
    return rows.map((r) =>
      withExportMatchIds(
        rowToRecord(r, Number.parseInt(String(r.legacy_id), 10), FIELD_KEYS).values,
        r.opportunity_id,
        r.legacy_id,
      ),
    );
  },
};
