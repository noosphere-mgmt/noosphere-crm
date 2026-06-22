import { fieldsToCsvRow } from "./adapterUtils";
import { escapeCsvCell } from "@/lib/csvEncoding";
import { getImportObjectDefinition, listExportFields } from "./objectRegistry";
import { buildTemplateCsv } from "./parseCsv";
import type { ImportObjectType } from "./types";
import { IMPORT_OBJECT_TYPES } from "./types";

export function getTemplateForObject(objectType: ImportObjectType): string {
  if (!IMPORT_OBJECT_TYPES.includes(objectType)) {
    throw new Error("Template not available for this object type");
  }

  const fields = listExportFields(objectType);
  const headers = fields.map((f) => f.key);
  const example = fields.map((f) => {
    if (f.lookupOnly) return f.key.includes("name") ? "Example Company Ltd" : "";
    if (f.key.endsWith("_id") && f.key !== "external_ref") return "";
    if (f.type === "date") return "2026-06-01";
    if (f.type === "boolean") return "true";
    if (f.type === "number") return "";
    if (f.key === "relationship_type") return "Refers";
    if (f.key === "from_entity_type" || f.key === "to_entity_type") return "contact";
    if (f.key === "status") return "Active";
    if (f.key === "country") return "Hong Kong";
    if (f.key === "city") return "Hong Kong";
    return "";
  });

  return buildTemplateCsv(headers, example);
}

export type ExportObjectCsvOptions = {
  /** When set, only rows whose match ID is in this list are exported. */
  ids?: string[];
};

export async function exportObjectCsv(
  objectType: ImportObjectType,
  options?: ExportObjectCsvOptions,
): Promise<string> {
  const def = getImportObjectDefinition(objectType);
  if (!def.exportRows) {
    throw new Error(`Export not implemented for ${objectType}`);
  }
  const fields = listExportFields(objectType);
  const headers = fields.map((f) => f.key);
  let rows: Record<string, unknown>[];
  const debug = process.env.EXPORT_ROWS_DEBUG === "1";
  if (debug) {
    console.error(`[exportRows] start objectType=${objectType} table=${def.tableName}`);
  }
  try {
    rows = await def.exportRows();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[exportRows] FAILED objectType=${objectType} table=${def.tableName}: ${message}`);
    throw err;
  }
  if (debug) {
    console.error(`[exportRows] ok objectType=${objectType} rows=${rows.length}`);
  }
  if (options?.ids?.length) {
    const idSet = new Set(options.ids.map(String));
    rows = rows.filter((row) => idSet.has(String(row[def.matchIdField] ?? "")));
  }
  const lines = [headers.join(",")];
  for (const row of rows) {
    const csvRow = fieldsToCsvRow(fields, row);
    lines.push(headers.map((h) => escapeCsvCell(csvRow[h] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

export function getFieldOptions(objectType: ImportObjectType) {
  const def = getImportObjectDefinition(objectType);
  return def.fields.map((f) => ({
    key: f.key,
    label: f.label,
    matchOnly: f.matchOnly ?? false,
    lookupOnly: f.lookupOnly ?? false,
  }));
}
