import { query } from "@/lib/db";
import { allocateNextBusinessId, ensureLegacyBusinessId, registerBusinessId } from "@/lib/businessIdResolve";
import { isPermanentBusinessId } from "@/lib/businessIds";
import { sqlContactDisplayName } from "@/lib/contactName";
import { resolveCompanyRefToLegacy, resolveContactRefToLegacy } from "@/lib/crmRefResolve";
import { COMPANY_ROLES, COMPANY_ROLE_LABELS } from "@/lib/lookups";
import { syncLegacyCompanyToV1 } from "@/lib/repos/companiesV1";
import type { CompanyRole } from "@/lib/types/entities";
import { applySessionMetadata, genericUpdateRecord, rowToRecord, withExportMatchIds } from "../adapterUtils";
import { sqlExportContactId, sqlJoinLegacyContact } from "../lookupSql";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import { mergeReferenceResults, resolveContactIdOrName } from "../referenceResolution";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord, RecordId } from "../types";

const FIELD_KEYS = [
  "company_id",
  "external_ref",
  "company_name_en",
  "company_name_zh",
  "company_name_cn",
  "role",
  "coverage",
  "country",
  "city",
  "district",
  "office_address",
  "industry",
  "source",
  "website",
  "phone",
  "email",
  "primary_contact_id",
  "primary_contact_name",
  "relationship_owner",
  "last_contact_date",
  "last_meeting_date",
  "next_follow_up_date",
  "relationship_strength",
  "is_active",
  "remarks",
] as const;

const SELECT = `
  co.id::text AS company_pk,
  COALESCE(cv.business_id, co.business_id) AS company_id,
  co.external_ref,
  co.company_name AS company_name_en,
  co.company_name_zh,
  co.company_name_cn,
  array_to_string(co.roles, '; ') AS role,
  array_to_string(co.coverage, '; ') AS coverage,
  co.country, co.city, co.district, co.office_address,
  co.industry, co.source, co.website, co.phone, co.email,
  CASE WHEN co.primary_contact_id IS NULL THEN NULL
       ELSE ${sqlExportContactId("co.primary_contact_id")} END AS primary_contact_id,
  ${sqlContactDisplayName("pc")} AS primary_contact_name,
  co.relationship_owner,
  co.last_contact_date::text AS last_contact_date,
  co.last_meeting_date::text AS last_meeting_date,
  co.next_follow_up_date::text AS next_follow_up_date,
  co.relationship_strength,
  co.is_active,
  co.notes AS remarks
`;

const FROM = `
  companies co
  LEFT JOIN companies_v1 cv ON cv.legacy_company_id = co.id
  LEFT JOIN contacts pc ON ${sqlJoinLegacyContact("pc", "co.primary_contact_id")}
`;

function dbPatch(values: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  if ("company_name_en" in values) p.company_name = values.company_name_en;
  if ("company_name_zh" in values) p.company_name_zh = values.company_name_zh;
  if ("company_name_cn" in values) p.company_name_cn = values.company_name_cn;
  if ("role" in values) {
    const raw = String(values.role ?? "");
    const parts = raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    const roles: CompanyRole[] = [];
    for (const part of parts) {
      const slug = part.toLowerCase().replace(/\s+/g, "_");
      const byLabel = (COMPANY_ROLES as readonly string[]).find(
        (r) => r === slug || COMPANY_ROLE_LABELS[r as CompanyRole].toLowerCase() === part.toLowerCase(),
      );
      if (byLabel) roles.push(byLabel as CompanyRole);
    }
    p.roles = roles.length ? roles : ["client"];
  }
  if ("coverage" in values) {
    p.coverage = String(values.coverage ?? "")
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if ("remarks" in values) p.notes = values.remarks;
  for (const k of ["external_ref", "country", "city", "district", "office_address", "industry", "source", "website", "phone", "email", "primary_contact_id", "relationship_owner", "last_contact_date", "last_meeting_date", "next_follow_up_date", "relationship_strength", "is_active"] as const) {
    if (k in values) p[k] = values[k];
  }
  return p;
}

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, String(row.company_id), FIELD_KEYS));
}

async function resolveCompanyRecordId(id: RecordId): Promise<number | null> {
  if (typeof id === "number") return id;
  return resolveCompanyRefToLegacy(id);
}

export const companiesImportDefinition: ImportObjectDefinition = {
  objectType: "companies",
  tableName: "companies",
  matchIdField: "company_id",
  idType: "text",

  fields: [
    { key: "company_id", label: "company_id", type: "string", matchOnly: true, aliases: ["id"] },
    { key: "external_ref", label: "external_ref", type: "string" },
    { key: "company_name_en", label: "company_name_en", type: "string", requiredOnCreate: true, aliases: ["company_name"] },
    { key: "company_name_zh", label: "company_name_zh", type: "string" },
    { key: "company_name_cn", label: "company_name_cn", type: "string" },
    { key: "role", label: "role", type: "string", aliases: ["roles"] },
    { key: "coverage", label: "coverage", type: "string_array" },
    { key: "country", label: "country", type: "string" },
    { key: "city", label: "city", type: "string" },
    { key: "district", label: "district", type: "string" },
    { key: "office_address", label: "office_address", type: "string" },
    { key: "industry", label: "industry", type: "string" },
    { key: "source", label: "source", type: "string" },
    { key: "website", label: "website", type: "string" },
    { key: "phone", label: "phone", type: "string" },
    { key: "email", label: "email", type: "string" },
    { key: "primary_contact_id", label: "primary_contact_id", type: "string" },
    { key: "primary_contact_name", label: "primary_contact_name", type: "string", lookupOnly: true },
    { key: "relationship_owner", label: "relationship_owner", type: "string" },
    { key: "last_contact_date", label: "last_contact_date", type: "date" },
    { key: "last_meeting_date", label: "last_meeting_date", type: "date" },
    { key: "next_follow_up_date", label: "next_follow_up_date", type: "date" },
    { key: "relationship_strength", label: "relationship_strength", type: "string" },
    { key: "is_active", label: "is_active", type: "boolean" },
    { key: "remarks", label: "remarks", type: "string", aliases: ["notes"] },
  ],

  async findById(id) {
    const legacyId = await resolveCompanyRecordId(id);
    if (legacyId == null) return null;
    const rows = await load("co.id = $1", [legacyId]);
    return rows[0] ?? null;
  },

  async findByExternalRef(externalRef) {
    return load("co.external_ref = $1", [externalRef.trim()]);
  },

  buildNaturalKey(values) {
    const name = String(values.company_name_en ?? "").trim();
    const city = String(values.city ?? "").trim();
    if (!name) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts([name, city]) };
  },

  async findByNaturalKey(key) {
    const parts = splitNaturalKeyParts(key, 2);
    if (!parts) return [];
    const [name, city] = parts;
    const rows = await query<{ id: string }>(
      `SELECT id::text FROM companies
       WHERE lower(trim(company_name)) = $1
         AND lower(trim(coalesce(city, ''))) = $2`,
      [name, city ?? ""],
    );
    if (rows.length === 0) return [];
    return load(`co.id = ANY($1::bigint[])`, [rows.map((r) => Number.parseInt(r.id, 10))]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    if (
      !suppliedFields.has("primary_contact_id") &&
      !("primary_contact_id" in writable) &&
      !suppliedFields.has("primary_contact_name")
    ) {
      return mergeReferenceResults();
    }
    return resolveContactIdOrName(
      "primary_contact_id",
      "primary_contact_name",
      values,
      suppliedFields,
      existing,
      writable,
      false,
    );
  },

  async createRecord(values, ctx) {
    const v = applySessionMetadata(dbPatch(values), ctx);
    const roles = (v.roles as CompanyRole[] | undefined)?.length ? v.roles : ["client"];
    const suppliedCompanyId = String(values.company_id ?? "").trim();
    const businessId = isPermanentBusinessId("company", suppliedCompanyId)
      ? suppliedCompanyId
      : await allocateNextBusinessId("company");
    const rows = await query<{ id: string }>(
      `INSERT INTO companies (
         company_name, company_name_zh, company_name_cn, roles, coverage,
         country, city, district, office_address, website, phone, email, industry, source,
         notes, primary_contact_id, external_ref, import_run_id, business_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING id::text`,
      [
        v.company_name ?? values.company_name_en ?? "",
        v.company_name_zh ?? null,
        v.company_name_cn ?? null,
        roles,
        v.coverage ?? [],
        v.country ?? null,
        v.city ?? null,
        v.district ?? null,
        v.office_address ?? null,
        v.website ?? null,
        v.phone ?? null,
        v.email ?? null,
        v.industry ?? null,
        v.source ?? null,
        v.notes ?? null,
        v.primary_contact_id ?? null,
        v.external_ref ?? null,
        v.import_run_id ?? null,
        businessId,
      ],
    );
    const id = Number.parseInt(rows[0]!.id, 10);
    await registerBusinessId({
      entityType: "company",
      businessId,
      primaryRef: String(id),
      legacyNumeric: id,
    });
    await syncLegacyCompanyToV1(
      id,
      String(v.company_name ?? values.company_name_en ?? ""),
      (v.company_name_zh as string | null | undefined) ?? null,
      v.is_active !== false,
    );
    const extra = dbPatch(values);
    const extraPatch = Object.fromEntries(Object.entries(extra).filter(([key]) => ["relationship_owner", "last_contact_date", "last_meeting_date", "next_follow_up_date", "relationship_strength", "is_active"].includes(key)));
    if (Object.keys(extraPatch).length) await genericUpdateRecord("companies", "id", id, extraPatch, ctx);
    return id;
  },

  async updateRecord(id, patch, ctx) {
    const legacyId = await resolveCompanyRecordId(id);
    if (legacyId == null) throw new Error(`company_id ${id} not found`);
    await genericUpdateRecord("companies", "id", legacyId, dbPatch(patch), ctx);
    await ensureLegacyBusinessId("company", legacyId);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} ORDER BY co.company_name ASC`);
    return rows.map((r) =>
      withExportMatchIds(
        rowToRecord(r, String(r.company_id ?? r.company_pk), FIELD_KEYS).values,
        r.company_id,
        r.company_pk,
      ),
    );
  },
};

export const COMPANY_ROLE_TEMPLATE_HINT = COMPANY_ROLES.map((r) => COMPANY_ROLE_LABELS[r]).join(", ");
