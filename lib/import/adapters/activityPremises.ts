import { query } from "@/lib/db";
import { rowToRecord } from "../adapterUtils";
import { sqlActivityLabel, sqlPremisesLabel } from "../lookupSql";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import {
  mergeReferenceResults,
  resolveActivityIdOrName,
  resolvePremisesIdOrName,
} from "../referenceResolution";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "activity_checkpoint_id",
  "activity_id",
  "activity_name",
  "premises_id",
  "premises_name",
  "building_name_en",
  "remarks",
] as const;

const SELECT = `
  ap.activity_id || ':' || ap.premises_id AS activity_checkpoint_id,
  ap.activity_id,
  ${sqlActivityLabel("a")} AS activity_name,
  ap.premises_id,
  ${sqlPremisesLabel("pm", "b")} AS premises_name,
  b.bldg_name_en AS building_name_en,
  NULL::text AS remarks
`;

const FROM = `
  activity_premises ap
  LEFT JOIN activities a ON a.activity_id = ap.activity_id
  LEFT JOIN premises_v1 pm ON pm.premises_id = ap.premises_id
  LEFT JOIN properties_v1 b ON b.property_id = pm.property_id
`;

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, String(row.activity_checkpoint_id), FIELD_KEYS));
}

export const activityPremisesImportDefinition: ImportObjectDefinition = {
  objectType: "activity_premises",
  tableName: "activity_premises",
  matchIdField: "activity_checkpoint_id",
  idType: "text",

  fields: [
    { key: "activity_checkpoint_id", label: "activity_checkpoint_id", type: "string", matchOnly: true, exportHidden: true },
    { key: "activity_id", label: "activity_id", type: "string", requiredOnCreate: true },
    { key: "activity_name", label: "activity_name", type: "string", lookupOnly: true },
    { key: "premises_id", label: "premises_id", type: "string", requiredOnCreate: true },
    { key: "premises_name", label: "premises_name", type: "string", lookupOnly: true },
    { key: "building_name_en", label: "building_name_en", type: "string", lookupOnly: true },
    { key: "remarks", label: "remarks", type: "string", exportHidden: true },
  ],

  async findById(id) {
    const [activityId, premisesId] = String(id).split(":");
    if (!activityId || !premisesId) return null;
    const rows = await load("ap.activity_id = $1 AND ap.premises_id = $2", [activityId, premisesId]);
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
    const parts = splitNaturalKeyParts(key, 2);
    if (!parts) return [];
    const [activityId, premisesId] = parts;
    return load("ap.activity_id = $1 AND ap.premises_id = $2", [activityId, premisesId]);
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    return mergeReferenceResults(
      await resolveActivityIdOrName(
        "activity_id",
        "activity_name",
        values,
        suppliedFields,
        existing,
        writable,
        true,
      ),
      await resolvePremisesIdOrName(
        "premises_id",
        "premises_name",
        values,
        suppliedFields,
        existing,
        writable,
        true,
      ),
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
    const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM ${FROM} ORDER BY ap.activity_id ASC`);
    return rows.map((r) => rowToRecord(r, String(r.activity_checkpoint_id), FIELD_KEYS).values);
  },
};
