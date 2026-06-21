import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { ACTIVITY_TYPES } from "@/lib/activityValues";
import { sqlContactDisplayName } from "@/lib/contactName";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import {
  sqlJoinLegacyCompany,
  sqlJoinLegacyContact,
  sqlJoinLegacyOpportunity,
  sqlPremisesLabel,
} from "../lookupSql";
import {
  mergeReferenceResults,
  resolveContactIdOrName,
  resolveLegacyCompanyIdOrName,
  resolveOpportunityIdOrName,
  resolvePremisesIdOrName,
} from "../referenceResolution";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "activity_id",
  "activity_date",
  "activity_time",
  "activity_type",
  "notes",
  "company_id",
  "company_name_en",
  "contact_id",
  "contact_name",
  "opportunity_id",
  "opportunity_name",
  "premises_id",
  "premises_name",
  "building_name_en",
] as const;

const SELECT = `
  a.activity_id,
  a.activity_date::text AS activity_date,
  a.activity_time,
  a.activity_type,
  a.notes,
  a.company_id::text AS company_id,
  c.company_name AS company_name_en,
  a.contact_id::text AS contact_id,
  ${sqlContactDisplayName("ct")} AS contact_name,
  a.opportunity_id::text AS opportunity_id,
  o.client_name AS opportunity_name,
  a.premises_id,
  ${sqlPremisesLabel("pm", "b")} AS premises_name,
  b.bldg_name_en AS building_name_en
`;

const FROM = `
  activities a
  LEFT JOIN companies c ON ${sqlJoinLegacyCompany("c", "a.company_id")}
  LEFT JOIN contacts ct ON ${sqlJoinLegacyContact("ct", "a.contact_id")}
  LEFT JOIN opportunities o ON ${sqlJoinLegacyOpportunity("o", "a.opportunity_id")}
  LEFT JOIN premises_v1 pm ON pm.premises_id = a.premises_id
  LEFT JOIN properties_v1 b ON b.property_id = pm.property_id
`;

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, String(row.activity_id), FIELD_KEYS));
}

export const activitiesImportDefinition: ImportObjectDefinition = {
  objectType: "activities",
  tableName: "activities",
  matchIdField: "activity_id",
  idType: "text",

  fields: [
    { key: "activity_id", label: "activity_id", type: "string", matchOnly: true },
    { key: "activity_date", label: "activity_date", type: "date", requiredOnCreate: true },
    { key: "activity_time", label: "activity_time", type: "string" },
    { key: "activity_type", label: "activity_type", type: "enum", enumValues: [...ACTIVITY_TYPES], requiredOnCreate: true },
    { key: "notes", label: "notes", type: "string" },
    { key: "company_id", label: "company_id", type: "string" },
    { key: "company_name_en", label: "company_name_en", type: "string", lookupOnly: true, aliases: ["company_name"] },
    { key: "contact_id", label: "contact_id", type: "string" },
    { key: "contact_name", label: "contact_name", type: "string", lookupOnly: true, aliases: ["assigned_contact_name"] },
    { key: "opportunity_id", label: "opportunity_id", type: "string" },
    { key: "opportunity_name", label: "opportunity_name", type: "string", lookupOnly: true },
    { key: "premises_id", label: "premises_id", type: "string" },
    { key: "premises_name", label: "premises_name", type: "string", lookupOnly: true },
    { key: "building_name_en", label: "building_name_en", type: "string", lookupOnly: true },
  ],

  async findById(id) {
    const rows = await load("a.activity_id = $1", [String(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef() {
    return [];
  },

  buildNaturalKey(values) {
    return {
      ok: true,
      key: buildNaturalKeyParts([
        String(values.activity_date ?? ""),
        String(values.activity_type ?? ""),
        String(values.company_id ?? ""),
        String(values.notes ?? "").slice(0, 80),
      ]),
    };
  },

  async findByNaturalKey(key) {
    const parts = splitNaturalKeyParts(key, 4);
    if (!parts) return [];
    const [date, type, companyId, notesPrefix] = parts;
    return load(
      `a.activity_date::text = $1 AND a.activity_type = $2
       AND coalesce(a.company_id::text, '') = $3
       AND left(coalesce(a.notes, ''), 80) = $4`,
      [date, type, companyId ?? "", notesPrefix ?? ""],
    );
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
      suppliedFields.has("contact_id") ||
      "contact_id" in writable ||
      suppliedFields.has("contact_name")
    ) {
      results.push(
        await resolveContactIdOrName(
          "contact_id",
          "contact_name",
          values,
          suppliedFields,
          existing,
          writable,
          false,
        ),
      );
    }
    if (
      suppliedFields.has("opportunity_id") ||
      "opportunity_id" in writable ||
      suppliedFields.has("opportunity_name")
    ) {
      results.push(
        await resolveOpportunityIdOrName(
          "opportunity_id",
          "opportunity_name",
          values,
          suppliedFields,
          existing,
          writable,
          false,
        ),
      );
    }
    if (
      suppliedFields.has("premises_id") ||
      "premises_id" in writable ||
      suppliedFields.has("premises_name")
    ) {
      results.push(
        await resolvePremisesIdOrName(
          "premises_id",
          "premises_name",
          values,
          suppliedFields,
          existing,
          writable,
          false,
        ),
      );
    }
    return mergeReferenceResults(...results);
  },

  async createRecord(values, ctx) {
    const v = applySessionMetadata(values, ctx);
    const activityId =
      String(v.activity_id ?? "").trim() ||
      `act_${randomUUID().replace(/-/g, "")}`;
    await query(
      `INSERT INTO activities (
         activity_id, activity_date, activity_time, activity_type, notes,
         company_id, contact_id, opportunity_id, premises_id, subject
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        activityId,
        v.activity_date,
        v.activity_time ?? null,
        v.activity_type,
        v.notes ?? null,
        v.company_id ?? null,
        v.contact_id ?? null,
        v.opportunity_id ?? null,
        v.premises_id ?? null,
        null,
      ],
    );
    return activityId;
  },

  async updateRecord(id, patch, ctx) {
    const p = { ...patch };
    delete p.activity_id;
    delete p.company_name_en;
    delete p.contact_name;
    delete p.opportunity_name;
    delete p.premises_name;
    delete p.building_name_en;
    await genericUpdateRecord("activities", "activity_id", id, p, ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} ORDER BY a.activity_date DESC`);
    return rows.map((r) => rowToRecord(r, String(r.activity_id), FIELD_KEYS).values);
  },
};
