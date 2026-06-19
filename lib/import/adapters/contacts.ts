import { query } from "@/lib/db";
import { COMPANY_ROLES, COMPANY_ROLE_LABELS } from "@/lib/lookups";
import type { CompanyRole } from "@/lib/types/entities";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { companyExists, validateFk } from "../fkValidation";
import { buildNaturalKeyParts } from "../matchRecord";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "contact_id",
  "external_ref",
  "company_id",
  "first_name",
  "last_name",
  "chinese_name",
  "display_name",
  "title",
  "contact_role",
  "coverage",
  "preferred_language",
  "mobile",
  "whatsapp",
  "wechat",
  "email",
  "country",
  "city",
  "remarks",
] as const;

const SELECT = `
  id::text AS contact_id,
  external_ref,
  company_id::text AS company_id,
  first_name, last_name, chinese_name, display_name, title,
  array_to_string(contact_role, '; ') AS contact_role,
  array_to_string(coverage, '; ') AS coverage,
  preferred_language,
  phone AS mobile,
  whatsapp, wechat, email,
  NULL::text AS country,
  NULL::text AS city,
  notes AS remarks
`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if ("mobile" in values) p.phone = values.mobile;
  if ("remarks" in values) p.notes = values.remarks;
  if ("contact_role" in values) {
    const raw = String(values.contact_role ?? "");
    const parts = raw.split(/[;,|]/).map((s) => s.trim()).filter(Boolean);
    const roles: CompanyRole[] = [];
    for (const part of parts) {
      const slug = part.toLowerCase().replace(/\s+/g, "_");
      const match = (COMPANY_ROLES as readonly string[]).find(
        (r) => r === slug || COMPANY_ROLE_LABELS[r as CompanyRole].toLowerCase() === part.toLowerCase(),
      );
      if (match) roles.push(match as CompanyRole);
    }
    p.contact_role = roles;
  }
  if ("coverage" in values) {
    p.coverage = String(values.coverage ?? "")
      .split(/[;,|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  for (const k of [
    "external_ref",
    "company_id",
    "first_name",
    "last_name",
    "chinese_name",
    "display_name",
    "title",
    "preferred_language",
    "whatsapp",
    "wechat",
    "email",
  ] as const) {
    if (k in values) p[k] = values[k];
  }
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM contacts WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, Number.parseInt(String(row.contact_id), 10), FIELD_KEYS));
}

export const contactsImportDefinition: ImportObjectDefinition = {
  objectType: "contacts",
  tableName: "contacts",
  matchIdField: "contact_id",
  idType: "number",

  fields: FIELD_KEYS.map((key) => ({
    key,
    label: key,
    type: "string",
    matchOnly: key === "contact_id",
    requiredOnCreate: key === "company_id" || key === "display_name" ? true : undefined,
    aliases: key === "contact_id" ? ["id"] : key === "mobile" ? ["phone"] : undefined,
  })),

  async findById(id) {
    const rows = await load("id = $1", [Number(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef(externalRef) {
    return load("external_ref = $1", [externalRef.trim()]);
  },

  buildNaturalKey(values) {
    const name = String(values.display_name ?? "").trim();
    const companyId = String(values.company_id ?? "").trim();
    if (!name || !companyId) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([name, companyId]) };
  },

  async findByNaturalKey(key) {
    const [name, companyId] = key.split("|");
    const rows = await query<{ id: string }>(
      `SELECT id::text FROM contacts
       WHERE lower(trim(coalesce(display_name, contact_name))) = $1 AND company_id = $2`,
      [name, Number.parseInt(companyId, 10)],
    );
    if (rows.length === 0) return [];
    return load(`id = ANY($1::bigint[])`, [rows.map((r) => Number.parseInt(r.id, 10))]);
  },

  async validateReferences(values, suppliedFields, existing) {
    const errors: string[] = [];
    const companyId = suppliedFields.has("company_id")
      ? values.company_id
      : existing?.values.company_id;
    const err = await validateFk("company_id", companyId, companyExists);
    if (err) errors.push(err);
    return errors;
  },

  async createRecord(values, ctx) {
    const v = applySessionMetadata(dbPatch(values), ctx);
    const displayName = String(values.display_name ?? "").trim() || null;
    const rows = await query<{ id: string }>(
      `INSERT INTO contacts (
         company_id, first_name, last_name, chinese_name, display_name, contact_name,
         title, phone, whatsapp, wechat, email, preferred_language,
         contact_role, coverage, notes, external_ref, import_run_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id::text`,
      [
        Number(v.company_id),
        v.first_name ?? null,
        v.last_name ?? null,
        v.chinese_name ?? null,
        displayName,
        displayName,
        v.title ?? null,
        v.phone ?? null,
        v.whatsapp ?? null,
        v.wechat ?? null,
        v.email ?? null,
        v.preferred_language ?? null,
        v.contact_role ?? [],
        v.coverage ?? [],
        v.notes ?? null,
        v.external_ref ?? null,
        v.import_run_id ?? null,
      ],
    );
    return Number.parseInt(rows[0]!.id, 10);
  },

  async updateRecord(id, patch, ctx) {
    await genericUpdateRecord("contacts", "id", id, dbPatch(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM contacts ORDER BY display_name ASC NULLS LAST`);
    return rows.map((r) => rowToRecord(r, Number.parseInt(String(r.contact_id), 10), FIELD_KEYS).values);
  },
};
