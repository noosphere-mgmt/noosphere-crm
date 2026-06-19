import type { ImportObjectDefinition } from "./objectRegistry";
import { coerceFieldValue } from "./coerce";

export function applyColumnMapping(
  rawRow: Record<string, string>,
  columnMapping: Record<string, string>,
  def: ImportObjectDefinition,
): { values: Record<string, unknown>; suppliedFields: Set<string> } {
  const values: Record<string, unknown> = {};
  const suppliedFields = new Set<string>();
  const fieldByKey = new Map(def.fields.map((f) => [f.key, f]));

  for (const [csvCol, fieldKey] of Object.entries(columnMapping)) {
    if (!fieldKey || fieldKey === "__skip__") continue;
    if (!(csvCol in rawRow)) continue;

    const field = fieldByKey.get(fieldKey);
    if (!field) continue;

    suppliedFields.add(fieldKey);
    const cell = rawRow[csvCol] ?? "";
    const coerced = coerceFieldValue(field, cell, { strict: false });
    values[fieldKey] = coerced.cleared ? "" : coerced.value;
  }

  return { values, suppliedFields };
}
