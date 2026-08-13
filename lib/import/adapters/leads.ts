import { query } from "@/lib/db";
import {
  LEAD_CSV_FIELD_KEYS,
  LEAD_EXPORT_HIDDEN_KEYS,
  LEAD_FIELD_LABELS,
  type LeadFieldKey,
} from "@/lib/leadFields";
import { LEAD_SOURCES, LEAD_STATUSES, normalizeLeadSource } from "@/lib/leadValues";
import {
  normalizeCategoryPreference,
  normalizeSpaceFormPreference,
} from "@/lib/opportunityPreferences";
import { genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import type { ImportFieldDef, ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord, ImportWriteContext } from "../types";

const FIELD_KEYS = LEAD_CSV_FIELD_KEYS;

/** Map CSV/form-facing keys to DB columns where names differ. */
const CSV_TO_DB: Partial<Record<LeadFieldKey, string>> = {
  lead_id: "id",
  location: "preferred_location",
};

const SELECT = FIELD_KEYS.map((key) => {
  if (key === "lead_id") return "id::text AS lead_id";
  if (key === "location") return "preferred_location AS location";
  if (key === "required_area_sqft") return "required_area_sqft::text AS required_area_sqft";
  if (key === "last_email_at") return "last_email_at::text AS last_email_at";
  if (key === "converted_at") return "converted_at::text AS converted_at";
  if (key === "next_lease_expiry") return "next_lease_expiry::text AS next_lease_expiry";
  if (key === "next_follow_up_date") return "next_follow_up_date::text AS next_follow_up_date";
  return key;
}).join(", ");

function fieldDef(key: LeadFieldKey): ImportFieldDef {
  const base = { key, label: LEAD_FIELD_LABELS[key] };
  if (LEAD_EXPORT_HIDDEN_KEYS.has(key)) {
    return {
      ...base,
      type: key === "converted_at" ? "date" : "number",
      integer: key !== "converted_at",
      exportHidden: true,
    };
  }
  if (key === "lead_id") {
    return { ...base, type: "number", integer: true, matchOnly: true, aliases: ["id"] };
  }
  if (key === "location") {
    return { ...base, type: "string", aliases: ["preferred_location"] };
  }
  if (key === "office_space_required") return { ...base, type: "boolean" };
  if (["required_area_sqft", "required_capacity_pax", "qualification_score"].includes(key)) {
    return { ...base, type: "number", integer: key !== "required_area_sqft" };
  }
  if (["next_lease_expiry", "next_follow_up_date"].includes(key)) {
    return { ...base, type: "date" };
  }
  if (key === "status") {
    return {
      ...base,
      type: "enum",
      enumValues: [...LEAD_STATUSES],
      defaultValue: "new",
    };
  }
  if (key === "source") {
    return {
      ...base,
      type: "enum",
      enumValues: [...LEAD_SOURCES],
      defaultValue: "direct",
      aliases: ["lead_source"],
    };
  }
  if (key === "property_category_preference") {
    return { ...base, type: "string", aliases: ["required_type", "asset_class"] };
  }
  if (key === "property_type_preference") {
    return { ...base, type: "string", aliases: ["required_subtype", "product_subtype", "space_form"] };
  }
  return { ...base, type: "string" };
}

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (key === "lead_id") continue;
    const dbKey = CSV_TO_DB[key as LeadFieldKey] ?? key;
    if (key === "source") {
      patch[dbKey] = normalizeLeadSource(value);
      continue;
    }
    if (key === "property_category_preference") {
      patch[dbKey] = normalizeCategoryPreference(value);
      continue;
    }
    if (key === "property_type_preference") {
      patch[dbKey] = normalizeSpaceFormPreference(value);
      continue;
    }
    patch[dbKey] = value;
  }
  return patch;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM leads WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, Number(row.lead_id), FIELD_KEYS));
}

const leadContext = (ctx: ImportWriteContext): ImportWriteContext => ({ ...ctx, importRunId: undefined });

export const leadsImportDefinition: ImportObjectDefinition = {
  objectType: "leads",
  tableName: "leads",
  matchIdField: "lead_id",
  idType: "number",
  fields: FIELD_KEYS.map(fieldDef),
  async findById(id) {
    return (await load("id = $1", [Number(id)]))[0] ?? null;
  },
  async findByExternalRef(externalRef) {
    return load("email_message_id = $1", [externalRef.trim()]);
  },
  buildNaturalKey(values) {
    const messageId = String(values.email_message_id ?? "").trim();
    const email = String(values.email ?? "").trim();
    const subject = String(values.email_subject ?? "").trim();
    if (!messageId && !email) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([messageId || email, messageId ? "" : subject]) };
  },
  async findByNaturalKey(key) {
    const parts = splitNaturalKeyParts(key, 2);
    if (!parts) return [];
    const [identity, subject] = parts;
    return load(
      `email_message_id = $1 OR (email_message_id IS NULL AND lower(trim(coalesce(email, ''))) = $2 AND lower(trim(coalesce(email_subject, ''))) = $3)`,
      [identity, identity, subject ?? ""],
    );
  },
  async createRecord(values) {
    const rows = await query<{ id: string }>(
      `INSERT INTO leads (status, contact_name, company_name, email) VALUES ($1,$2,$3,$4) RETURNING id::text`,
      [values.status ?? "new", values.contact_name ?? null, values.company_name ?? null, values.email ?? null],
    );
    const id = Number(rows[0]!.id);
    await genericUpdateRecord("leads", "id", id, dbPatch(values), {});
    return id;
  },
  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("leads", "id", id, dbPatch(patch), leadContext(ctx));
  },
  async exportRows() {
    const rows = await query<Record<string, unknown>>(
      `SELECT ${SELECT} FROM leads ORDER BY updated_at DESC`,
    );
    return rows.map((row) => rowToRecord(row, Number(row.lead_id), FIELD_KEYS).values);
  },
};
