import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { ACTIVITY_TYPES } from "@/lib/activityValues";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import {
  companyExists,
  contactExists,
  opportunityExists,
  premisesExists,
  validateFk,
  validateFkText,
} from "../fkValidation";
import { buildNaturalKeyParts } from "../matchRecord";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "activity_id",
  "activity_date",
  "activity_time",
  "activity_type",
  "notes",
  "company_id",
  "contact_id",
  "opportunity_id",
  "premises_id",
] as const;

const SELECT = `
  activity_id,
  activity_date::text AS activity_date,
  activity_time,
  activity_type,
  notes,
  company_id::text AS company_id,
  contact_id::text AS contact_id,
  opportunity_id::text AS opportunity_id,
  premises_id
`;

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM activities WHERE ${where}`, params);
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
    { key: "company_id", label: "company_id", type: "number", integer: true },
    { key: "contact_id", label: "contact_id", type: "number", integer: true },
    { key: "opportunity_id", label: "opportunity_id", type: "number", integer: true },
    { key: "premises_id", label: "premises_id", type: "string" },
  ],

  async findById(id) {
    const rows = await load("activity_id = $1", [String(id)]);
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
    const [date, type, companyId, notesPrefix] = key.split("|");
    return load(
      `activity_date::text = $1 AND activity_type = $2
       AND coalesce(company_id::text, '') = $3
       AND left(coalesce(notes, ''), 80) = $4`,
      [date, type, companyId ?? "", notesPrefix ?? ""],
    );
  },

  async validateReferences(values, suppliedFields) {
    const errors: string[] = [];
    for (const [field, check] of [
      ["company_id", companyExists],
      ["contact_id", contactExists],
      ["opportunity_id", opportunityExists],
    ] as const) {
      if (suppliedFields.has(field)) {
        const err = await validateFk(field, values[field], check);
        if (err) errors.push(err);
      }
    }
    if (suppliedFields.has("premises_id")) {
      const err = await validateFkText("premises_id", values.premises_id, premisesExists);
      if (err) errors.push(err);
    }
    return errors;
  },

  async createRecord(values, ctx) {
    const activityId =
      String(values.activity_id ?? "").trim() ||
      `act_${randomUUID().replace(/-/g, "")}`;
    await query(
      `INSERT INTO activities (
         activity_id, activity_date, activity_time, activity_type, notes,
         company_id, contact_id, opportunity_id, premises_id, subject
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        activityId,
        values.activity_date,
        values.activity_time ?? null,
        values.activity_type,
        values.notes ?? null,
        values.company_id ?? null,
        values.contact_id ?? null,
        values.opportunity_id ?? null,
        values.premises_id ?? null,
        null,
      ],
    );
    return activityId;
  },

  async updateRecord(id, patch, ctx) {
    const p = { ...patch };
    delete p.activity_id;
    await genericUpdateRecord("activities", "activity_id", id, p, ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM activities ORDER BY activity_date DESC`);
    return rows.map((r) => rowToRecord(r, String(r.activity_id), FIELD_KEYS).values);
  },
};
