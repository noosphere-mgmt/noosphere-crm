import { query } from "@/lib/db";
import { resolveContactName, sqlContactDisplayName, syncContactDerivedNames } from "@/lib/contactName";
import { resolveCompanyRefToLegacy, resolveContactRefToLegacy } from "@/lib/crmRefResolve";
import { COMPANY_ROLES, COMPANY_ROLE_LABELS } from "@/lib/lookups";
import type { CompanyRole } from "@/lib/types/entities";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { sqlExportCompanyId, sqlExportContactId, sqlJoinLegacyCompany } from "../lookupSql";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import { resolveLegacyCompanyIdOrName } from "../referenceResolution";
import type { ImportFieldDef, ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord, RecordId } from "../types";

const FIELD_KEYS = [
  "contact_id",
  "external_ref",
  "company_id",
  "company_name_en",
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
  ${sqlExportContactId("ct.id")} AS contact_id,
  ct.external_ref,
  ${sqlExportCompanyId("ct.company_id")} AS company_id,
  c.company_name AS company_name_en,
  ct.first_name, ct.last_name, ct.chinese_name,
  ${sqlContactDisplayName("ct")} AS display_name,
  ct.title,
  array_to_string(ct.contact_role, '; ') AS contact_role,
  array_to_string(ct.coverage, '; ') AS coverage,
  ct.preferred_language,
  ct.phone AS mobile,
  ct.whatsapp, ct.wechat, ct.email,
  NULL::text AS country,
  NULL::text AS city,
  ct.notes AS remarks
`;

const FROM = `contacts ct LEFT JOIN companies c ON ${sqlJoinLegacyCompany("c", "ct.company_id")}`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if ("mobile" in values) p.phone = values.mobile;
  if ("remarks" in values) p.notes = values.remarks;
  if ("contact_role" in values) {
    const raw = String(values.contact_role ?? "");
    const parts = raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
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
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  for (const k of [
    "external_ref",
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
    if (k in values) {
      p[k] = values[k];
    }
  }
  if ("company_id" in values) {
    p.company_id = values.company_id;
  }
  return p;
}

function contactFieldDef(key: (typeof FIELD_KEYS)[number]): ImportFieldDef {
  const base = { key, label: key };
  if (key === "contact_id") {
    return { ...base, type: "string", matchOnly: true, aliases: ["id"] };
  }
  if (key === "company_id") {
    return { ...base, type: "string" };
  }
  if (key === "company_name_en") {
    return { ...base, type: "string", lookupOnly: true, aliases: ["company_name"] };
  }
  if (key === "display_name") {
    return { ...base, type: "string" };
  }
  if (key === "coverage") {
    return { ...base, type: "string_array" };
  }
  if (key === "mobile") {
    return { ...base, type: "string", aliases: ["phone"] };
  }
  if (key === "chinese_name") {
    return { ...base, type: "string", aliases: ["chinese name", "中文名", "chinese"] };
  }
  return { ...base, type: "string" };
}

function requireCompanyId(raw: unknown): Promise<number> {
  return resolveCompanyRefToLegacy(raw).then((id) => {
    if (id == null) {
      throw new Error(
        "company_id is required — use COMP-* business id, numeric legacy id, or company external_ref (import companies first)",
      );
    }
    return id;
  });
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, String(row.contact_id), FIELD_KEYS));
}

async function resolveContactRecordId(id: RecordId): Promise<number | null> {
  if (typeof id === "number") return id;
  return resolveContactRefToLegacy(id);
}

export const contactsImportDefinition: ImportObjectDefinition = {
  objectType: "contacts",
  tableName: "contacts",
  matchIdField: "contact_id",
  idType: "text",

  fields: FIELD_KEYS.map((key) => contactFieldDef(key)),

  async findById(id) {
    const legacyId = await resolveContactRecordId(id);
    if (legacyId == null) return null;
    const rows = await load("ct.id = $1", [legacyId]);
    return rows[0] ?? null;
  },

  async findByExternalRef(externalRef) {
    return load("ct.external_ref = $1", [externalRef.trim()]);
  },

  buildNaturalKey(values) {
    const name = resolveContactName({
      display_name: values.display_name as string | null,
      first_name: values.first_name as string | null,
      last_name: values.last_name as string | null,
      chinese_name: values.chinese_name as string | null,
    }).trim();
    const companyId = String(values.company_id ?? "").trim();
    if (!name || !companyId) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([name, companyId]) };
  },

  async prepareMatchValues(values) {
    const synced = syncContactDerivedNames({
      first_name: values.first_name as string | null,
      last_name: values.last_name as string | null,
      chinese_name: values.chinese_name as string | null,
      display_name: values.display_name as string | null,
    });
    const composed = resolveContactName(synced);
    if (!composed) return values;
    if (!String(values.display_name ?? "").trim()) {
      return { ...values, display_name: composed };
    }
    return values;
  },

  async findByNaturalKey(key) {
    const parts = splitNaturalKeyParts(key, 2);
    if (!parts) return [];
    const [name, companyId] = parts;
    const companyLegacy = await resolveCompanyRefToLegacy(companyId);
    if (companyLegacy == null) return [];
    const rows = await query<{ id: string }>(
      `SELECT ct.id::text FROM ${FROM}
       WHERE lower(trim(${sqlContactDisplayName("ct")})) = $1 AND ct.company_id = $2`,
      [name, companyLegacy],
    );
    if (rows.length === 0) return [];
    return load(`ct.id = ANY($1::bigint[])`, [rows.map((r) => Number.parseInt(r.id, 10))]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    return resolveLegacyCompanyIdOrName(
      "company_id",
      "company_name_en",
      values,
      suppliedFields,
      existing,
      writable,
      !existing,
    );
  },

  async createRecord(values, ctx) {
    const v = applySessionMetadata(dbPatch(values), ctx);
    const synced = syncContactDerivedNames({
      first_name: values.first_name as string | null,
      last_name: values.last_name as string | null,
      chinese_name: values.chinese_name as string | null,
      display_name: values.display_name as string | null,
    });
    const displayName = resolveContactName(synced) || null;
    const companyId = await requireCompanyId(v.company_id);
    const rows = await query<{ id: string }>(
      `INSERT INTO contacts (
         company_id, first_name, last_name, chinese_name, display_name, contact_name,
         title, phone, whatsapp, wechat, email, preferred_language,
         contact_role, coverage, notes, external_ref, import_run_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id::text`,
      [
        companyId,
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
    const legacyId = await resolveContactRecordId(id);
    if (legacyId == null) throw new Error(`contact_id ${id} not found`);
    await genericUpdateRecord("contacts", "id", legacyId, dbPatch(patch), ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(
      `SELECT ${SELECT} FROM ${FROM} ORDER BY ct.display_name ASC NULLS LAST`,
    );
    return rows.map((r) => rowToRecord(r, String(r.contact_id), FIELD_KEYS).values);
  },
};
