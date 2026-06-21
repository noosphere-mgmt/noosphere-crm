import { query } from "@/lib/db";
import { createRelationship } from "@/lib/repos/relationships";
import {
  CREATION_RELATIONSHIP_TYPES,
  isCreationRelationshipType,
  isEntityType,
} from "@/lib/entityRelationships";
import { genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { sqlRelationshipEntityName } from "../lookupSql";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../matchRecord";
import { mergeReferenceResults, resolveRelationshipEntityIdOrName } from "../referenceResolution";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "relationship_id",
  "from_entity_type",
  "from_entity_id",
  "from_entity_name",
  "relationship_type",
  "to_entity_type",
  "to_entity_id",
  "to_entity_name",
  "status",
  "start_date",
  "end_date",
  "remarks",
] as const;

const SELECT = `
  r.relationship_id,
  r.from_entity_type,
  r.from_entity_id,
  ${sqlRelationshipEntityName("r.from_entity_type", "r.from_entity_id")} AS from_entity_name,
  r.relationship_type,
  r.to_entity_type,
  r.to_entity_id,
  ${sqlRelationshipEntityName("r.to_entity_type", "r.to_entity_id")} AS to_entity_name,
  r.status,
  r.start_date::text AS start_date,
  r.end_date::text AS end_date,
  r.remarks
`;

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(
    `SELECT ${SELECT} FROM relationships r WHERE ${where}`,
    params,
  );
  return rows.map((row) => rowToRecord(row, String(row.relationship_id), FIELD_KEYS));
}

export const relationshipsImportDefinition: ImportObjectDefinition = {
  objectType: "relationships",
  tableName: "relationships",
  matchIdField: "relationship_id",
  idType: "text",

  fields: [
    { key: "relationship_id", label: "relationship_id", type: "string", matchOnly: true },
    { key: "from_entity_type", label: "from_entity_type", type: "enum", enumValues: ["company", "contact"], requiredOnCreate: true },
    { key: "from_entity_id", label: "from_entity_id", type: "string" },
    { key: "from_entity_name", label: "from_entity_name", type: "string", lookupOnly: true },
    { key: "relationship_type", label: "relationship_type", type: "enum", enumValues: [...CREATION_RELATIONSHIP_TYPES], requiredOnCreate: true },
    { key: "to_entity_type", label: "to_entity_type", type: "enum", enumValues: ["company", "contact"], requiredOnCreate: true },
    { key: "to_entity_id", label: "to_entity_id", type: "string" },
    { key: "to_entity_name", label: "to_entity_name", type: "string", lookupOnly: true },
    { key: "status", label: "status", type: "enum", enumValues: ["Active", "Inactive"], defaultValue: "Active" },
    { key: "start_date", label: "start_date", type: "date" },
    { key: "end_date", label: "end_date", type: "date" },
    { key: "remarks", label: "remarks", type: "string" },
  ],

  async findById(id) {
    const rows = await load("r.relationship_id = $1", [String(id)]);
    return rows[0] ?? null;
  },

  async findByExternalRef() {
    return [];
  },

  buildNaturalKey(values) {
    const parts = [
      String(values.from_entity_type ?? ""),
      String(values.from_entity_id ?? ""),
      String(values.relationship_type ?? ""),
      String(values.to_entity_type ?? ""),
      String(values.to_entity_id ?? ""),
    ];
    if (parts.some((p) => !p.trim())) return { ok: false, key: "" };
    return { ok: true, key: buildNaturalKeyParts(parts) };
  },

  async findByNaturalKey(key) {
    const parts = splitNaturalKeyParts(key, 5);
    if (!parts) return [];
    const [fromType, fromId, relType, toType, toId] = parts;
    return load(
      `r.from_entity_type = $1 AND r.from_entity_id = $2 AND r.relationship_type = $3
       AND r.to_entity_type = $4 AND r.to_entity_id = $5`,
      [fromType, fromId, relType, toType, toId],
    );
  },

  async validateReferences(values, suppliedFields, existing, writable) {
    const errors: string[] = [];
    const results = [];

    if (
      suppliedFields.has("from_entity_id") ||
      "from_entity_id" in writable ||
      suppliedFields.has("from_entity_name") ||
      !existing
    ) {
      results.push(
        await resolveRelationshipEntityIdOrName(
          "from_entity_id",
          "from_entity_name",
          "from_entity_type",
          values,
          suppliedFields,
          existing,
          writable,
          !existing,
        ),
      );
    }
    if (
      suppliedFields.has("to_entity_id") ||
      "to_entity_id" in writable ||
      suppliedFields.has("to_entity_name") ||
      !existing
    ) {
      results.push(
        await resolveRelationshipEntityIdOrName(
          "to_entity_id",
          "to_entity_name",
          "to_entity_type",
          values,
          suppliedFields,
          existing,
          writable,
          !existing,
        ),
      );
    }

    const relType = String(values.relationship_type ?? existing?.values.relationship_type ?? "");
    if (relType && !isCreationRelationshipType(relType)) {
      errors.push(`relationship_type must be Refers or Represents (reverse rows are auto-created)`);
    }

    const merged = mergeReferenceResults(...results);
    merged.errors.push(...errors);
    return merged;
  },

  async createRecord(values) {
    const relType = String(values.relationship_type ?? "");
    if (!isCreationRelationshipType(relType)) throw new Error("relationship_type must be Refers or Represents");
    const fromType = String(values.from_entity_type ?? "");
    const toType = String(values.to_entity_type ?? "");
    if (!isEntityType(fromType) || !isEntityType(toType)) throw new Error("Invalid entity type");
    return createRelationship({
      from_entity_type: fromType,
      from_entity_id: String(values.from_entity_id ?? "").trim(),
      to_entity_type: toType,
      to_entity_id: String(values.to_entity_id ?? "").trim(),
      relationship_type: relType,
      status: (values.status as "Active" | "Inactive") ?? "Active",
      start_date: values.start_date as string | null,
      end_date: values.end_date as string | null,
      remarks: values.remarks as string | null,
    });
  },

  async updateRecord(id, patch, ctx) {
    const p = { ...patch };
    delete p.from_entity_name;
    delete p.to_entity_name;
    await genericUpdateRecord("relationships", "relationship_id", id, p, ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(
      `SELECT ${SELECT} FROM relationships r
       WHERE r.relationship_type IN ('Refers', 'Represents')
       ORDER BY r.updated_at DESC`,
    );
    return rows.map((r) => rowToRecord(r, String(r.relationship_id), FIELD_KEYS).values);
  },
};
