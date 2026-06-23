import { query } from "@/lib/db";
import {
  coercePremisesV1PatchForDb,
  coercePropertyV1PatchForDb,
  describeV1UpdateParams,
  formatSqlParamDebug,
} from "@/lib/propertyV1DbCoerce";
import type { PremisesV1Patch } from "@/lib/repos/premisesV1";
import type { PropertyV1Patch } from "@/lib/repos/propertiesV1";
import type { ImportFieldDef, ImportObjectDefinition } from "./objectRegistry";
import type { ExistingRecord, ImportWriteContext, RecordId } from "./types";

export function rowToRecord(
  row: Record<string, unknown>,
  id: RecordId,
  fieldKeys: readonly string[],
): ExistingRecord {
  const values: Record<string, unknown> = {};
  for (const key of fieldKeys) {
    values[key] = row[key] ?? null;
  }
  return { id, values };
}

export async function loadRecords(
  def: ImportObjectDefinition,
  where: string,
  params: unknown[],
  fieldKeys: readonly string[],
  idColumn: string,
): Promise<ExistingRecord[]> {
  const cols = [...new Set([idColumn, ...fieldKeys])].join(", ");
  const rows = await query<Record<string, unknown>>(
    `SELECT ${cols} FROM ${def.tableName} WHERE ${where}`,
    params,
  );
  return rows.map((row) =>
    rowToRecord(row, def.idType === "number" ? Number(row[idColumn]) : String(row[idColumn]), fieldKeys),
  );
}

async function coerceImportPatch(
  tableName: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (tableName === "properties_v1") {
    return (await coercePropertyV1PatchForDb(patch as PropertyV1Patch)) as Record<string, unknown>;
  }
  if (tableName === "premises_v1") {
    return (await coercePremisesV1PatchForDb(patch as PremisesV1Patch)) as Record<string, unknown>;
  }
  return patch;
}

export async function genericUpdateRecord(
  tableName: string,
  idColumn: string,
  id: RecordId,
  patch: Record<string, unknown>,
  ctx: ImportWriteContext,
  extraSets?: Record<string, unknown>,
): Promise<void> {
  const coercedPatch = await coerceImportPatch(tableName, patch);
  const sets: string[] = [];
  const params: unknown[] = [id];
  let i = 2;

  for (const [key, val] of Object.entries(coercedPatch)) {
    if (key === "id") continue;
    sets.push(`${key} = $${i}`);
    params.push(val);
    i++;
  }
  if (extraSets) {
    for (const [key, val] of Object.entries(extraSets)) {
      sets.push(`${key} = $${i}`);
      params.push(val);
      i++;
    }
  }
  if (ctx.importRunId) {
    sets.push(`import_run_id = $${i}`);
    params.push(ctx.importRunId);
    i++;
  }
  if (sets.length === 0) return;
  try {
    await query(`UPDATE ${tableName} SET ${sets.join(", ")} WHERE ${idColumn} = $1`, params);
  } catch (err) {
    const debug = formatSqlParamDebug(
      describeV1UpdateParams(idColumn, String(id), { ...coercedPatch, ...extraSets }),
    );
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${message} | ${tableName} UPDATE params: ${debug}`);
  }
}

export function applySessionMetadata(
  values: Record<string, unknown>,
  ctx: ImportWriteContext,
): Record<string, unknown> {
  const out = { ...values };
  const meta = ctx.sessionMetadata;
  if (meta?.source_system && out.source_system == null) out.source_system = meta.source_system;
  if (meta?.source_file && out.source_file == null) out.source_file = meta.source_file;
  if (meta?.source_date && out.source_date == null) out.source_date = meta.source_date;
  if (ctx.importRunId) out.import_run_id = ctx.importRunId;
  return out;
}

export function fieldsToCsvRow(
  fields: ImportFieldDef[],
  values: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = values[f.key];
    if (v == null) {
      out[f.key] = "";
      continue;
    }
    if (Array.isArray(v)) {
      out[f.key] = v.join("; ");
      continue;
    }
    if (typeof v === "boolean") {
      out[f.key] = v ? "true" : "false";
      continue;
    }
    out[f.key] = String(v);
  }
  return out;
}

export function exportFieldKeys(fields: ImportFieldDef[]): string[] {
  return fields.filter((f) => !f.exportHidden).map((f) => f.key);
}
