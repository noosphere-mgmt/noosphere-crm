import { query } from "@/lib/db";
import { rowToRecord } from "../adapterUtils";
import { buildNaturalKeyParts } from "../matchRecord";
import {
  mergeReferenceResults,
  resolveActivityReference,
  resolvePremisesReference,
} from "../referenceResolution";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = ["activity_checkpoint_id", "activity_id", "premises_id", "remarks"] as const;

const SELECT = `
  activity_id || ':' || premises_id AS activity_checkpoint_id,
  activity_id,
  premises_id,
  NULL::text AS remarks
`;

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM activity_premises WHERE ${where}`, params);
  return rows.map((row) =>
    rowToRecord(row, String(row.activity_checkpoint_id), FIELD_KEYS),
  );
}

export const activityPremisesImportDefinition: ImportObjectDefinition = {
  objectType: "activity_premises",
  tableName: "activity_premises",
  matchIdField: "activity_checkpoint_id",
  idType: "text",

  fields: [
    { key: "activity_checkpoint_id", label: "activity_checkpoint_id", type: "string", matchOnly: true },
    { key: "activity_id", label: "activity_id", type: "string", requiredOnCreate: true },
    { key: "premises_id", label: "premises_id", type: "string", requiredOnCreate: true },
    { key: "remarks", label: "remarks", type: "string", exportHidden: true },
  ],

  async findById(id) {
    const [activityId, premisesId] = String(id).split(":");
    if (!activityId || !premisesId) return null;
    const rows = await load("activity_id = $1 AND premises_id = $2", [activityId, premisesId]);
    return rows[0] ?? null;
  },

  async findByExternalRef() {
    return [];
  },

  buildNaturalKey(values) {
    return {
      ok: true,
      key: buildNaturalKeyParts([String(values.activity_id ?? ""), String(values.premises_id ?? "")]),
    };
  },

  async findByNaturalKey(key) {
    const [activityId, premisesId] = key.split("|");
    return load("activity_id = $1 AND premises_id = $2", [activityId, premisesId]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    const activityId = suppliedFields.has("activity_id")
      ? values.activity_id
      : existing?.values.activity_id ?? writable.activity_id;
    const premisesId = suppliedFields.has("premises_id")
      ? values.premises_id
      : existing?.values.premises_id ?? writable.premises_id;
    return mergeReferenceResults(
      await resolveActivityReference("activity_id", activityId, true),
      await resolvePremisesReference("premises_id", premisesId, true),
    );
  },

  async createRecord(values) {
    await query(
      `INSERT INTO activity_premises (activity_id, premises_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [String(values.activity_id), String(values.premises_id)],
    );
    return `${values.activity_id}:${values.premises_id}`;
  },

  async updateRecord() {
    /* junction rows are create-only in v1 */
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM activity_premises ORDER BY activity_id ASC`);
    return rows.map((r) => rowToRecord(r, String(r.activity_checkpoint_id), FIELD_KEYS).values);
  },
};
