import type { ImportObjectDefinition } from "./objectRegistry";
import type { ExistingRecord } from "./types";
import { coerceFieldValue, isFieldSupplied } from "./coerce";

export type PatchResult = {
  action: "create" | "update" | "clear_value" | "no_change";
  writable: Record<string, unknown>;
  changes: Array<{
    field: string;
    label: string;
    op: "set" | "clear";
    old_value: unknown;
    new_value: unknown;
  }>;
  errors: string[];
};

export function computePatch(
  def: ImportObjectDefinition,
  mappedValues: Record<string, unknown>,
  suppliedFields: Set<string>,
  existing: ExistingRecord | null,
): PatchResult {
  const changes: PatchResult["changes"] = [];
  const errors: string[] = [];
  const writable: Record<string, unknown> = {};

  for (const field of def.fields) {
    if (!isFieldSupplied(field.key, suppliedFields)) continue;

    const rawInput = mappedValues[field.key];
    const coerced = coerceFieldValue(field, rawInput, { strict: true });
    if (coerced.error) {
      errors.push(`${field.label}: ${coerced.error}`);
      continue;
    }

    if (existing) {
      const oldVal = existing.values[field.key];
      const newVal = coerced.value;

      if (coerced.cleared) {
        if (oldVal != null && oldVal !== "" && !(Array.isArray(oldVal) && oldVal.length === 0)) {
          changes.push({
            field: field.key,
            label: field.label,
            op: "clear",
            old_value: oldVal,
            new_value: null,
          });
          writable[field.key] = null;
        }
      } else if (!valuesEqual(oldVal, newVal)) {
        changes.push({
          field: field.key,
          label: field.label,
          op: "set",
          old_value: oldVal,
          new_value: newVal,
        });
        writable[field.key] = newVal;
      }
    } else if (!coerced.cleared) {
      writable[field.key] = coerced.value;
    } else if (field.requiredOnCreate) {
      errors.push(`${field.label} is required on create`);
    }
  }

  if (existing) {
    if (changes.length === 0) {
      return { action: "no_change", writable, changes, errors };
    }
    const onlyClears = changes.every((c) => c.op === "clear");
    return { action: onlyClears ? "clear_value" : "update", writable, changes, errors };
  }

  for (const field of def.fields) {
    if (field.requiredOnCreate && !isFieldSupplied(field.key, suppliedFields)) {
      if (field.defaultValue !== undefined) {
        writable[field.key] = field.defaultValue;
      } else if (writable[field.key] == null) {
        errors.push(`${field.label} is required on create`);
      }
    }
  }

  return { action: "create", writable, changes, errors };
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  }
  return a === b || String(a ?? "") === String(b ?? "");
}
