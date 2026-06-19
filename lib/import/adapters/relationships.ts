import { query } from "@/lib/db";
import { createRelationship } from "@/lib/repos/relationships";
import {
  CREATION_RELATIONSHIP_TYPES,
  isCreationRelationshipType,
  isEntityType,
} from "@/lib/entityRelationships";
import { applySessionMetadata, genericUpdateRecord, rowToRecord } from "../adapterUtils";
import { companyExists, contactExists, parseOptionalInt } from "../fkValidation";
import { buildNaturalKeyParts } from "../matchRecord";
import type { ImportObjectDefinition } from "../objectRegistry";
import type { ExistingRecord } from "../types";

const FIELD_KEYS = [
  "relationship_id",
  "from_entity_type",
  "from_entity_id",
  "relationship_type",
  "to_entity_type",
  "to_entity_id",
  "status",
  "start_date",
  "end_date",
  "remarks",
] as const;

const SELECT = `
  relationship_id,
  from_entity_type,
  from_entity_id,
  relationship_type,
  to_entity_type,
  to_entity_id,
  status,
  start_date::text AS start_date,
  end_date::text AS end_date,
  remarks
`;

async function load(where: string, params: unknown[]): Promise<ExistingRecord[]> {
  const rows = await query<Record<string, unknown>>(`SELECT ${SELECT} FROM relationships WHERE ${where}`, params);
  return rows.map((row) => rowToRecord(row, String(row.relationship_id), FIELD_KEYS));
}

async function entityExists(type: string, id: string): Promise<boolean> {
  if (!isEntityType(type)) return false;
  if (type === "company") return companyExists(Number.parseInt(id, 10));
  return contactExists(Number.parseInt(id, 10));
}

export const relationshipsImportDefinition: ImportObjectDefinition = {
  objectType: "relationships",
  tableName: "relationships",
  matchIdField: "relationship_id",
  idType: "text",

  fields: [
    { key: "relationship_id", label: "relationship_id", type: "string", matchOnly: true },
    { key: "from_entity_type", label: "from_entity_type", type: "enum", enumValues: ["company", "contact"], requiredOnCreate: true },
    { key: "from_entity_id", label: "from_entity_id", type: "string", requiredOnCreate: true },
    { key: "relationship_type", label: "relationship_type", type: "enum", enumValues: [...CREATION_RELATIONSHIP_TYPES], requiredOnCreate: true },
    { key: "to_entity_type", label: "to_entity_type", type: "enum", enumValues: ["company", "contact"], requiredOnCreate: true },
    { key: "to_entity_id", label: "to_entity_id", type: "string", requiredOnCreate: true },
    { key: "status", label: "status", type: "enum", enumValues: ["Active", "Inactive"], defaultValue: "Active" },
    { key: "start_date", label: "start_date", type: "date" },
    { key: "end_date", label: "end_date", type: "date" },
    { key: "remarks", label: "remarks", type: "string" },
  ],

  async findById(id) {
    const rows = await load("relationship_id = $1", [String(id)]);
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
    const [fromType, fromId, relType, toType, toId] = key.split("|");
    return load(
      `from_entity_type = $1 AND from_entity_id = $2 AND relationship_type = $3
       AND to_entity_type = $4 AND to_entity_id = $5`,
      [fromType, fromId, relType, toType, toId],
    );
  },

  async validateReferences(values, suppliedFields, existing) {
    const errors: string[] = [];
    const fromType = String(values.from_entity_type ?? existing?.values.from_entity_type ?? "");
    const fromId = String(values.from_entity_id ?? existing?.values.from_entity_id ?? "");
    const toType = String(values.to_entity_type ?? existing?.values.to_entity_type ?? "");
    const toId = String(values.to_entity_id ?? existing?.values.to_entity_id ?? "");
    if (fromType && fromId && !(await entityExists(fromType, fromId))) {
      errors.push(`from_entity ${fromType} ${fromId} not found`);
    }
    if (toType && toId && !(await entityExists(toType, toId))) {
      errors.push(`to_entity ${toType} ${toId} not found`);
    }
    const relType = String(values.relationship_type ?? existing?.values.relationship_type ?? "");
    if (relType && !isCreationRelationshipType(relType)) {
      errors.push(`relationship_type must be Refers or Represents (reverse rows are auto-created)`);
    }
    return errors;
  },

  async createRecord(values, ctx) {
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
    await genericUpdateRecord("relationships", "relationship_id", id, patch, ctx);
  },

  async exportRows() {
    const rows = await query<Record<string, unknown>>(
      `SELECT ${SELECT} FROM relationships
       WHERE relationship_type IN ('Refers', 'Represents')
       ORDER BY updated_at DESC`,
    );
    return rows.map((r) => rowToRecord(r, String(r.relationship_id), FIELD_KEYS).values);
  },
};
