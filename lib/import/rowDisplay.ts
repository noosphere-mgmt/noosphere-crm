import type { FieldChange, ImportObjectType, ImportRowAction } from "./types";

const ACTION_LABELS: Record<ImportRowAction, string> = {
  create: "Created",
  update: "Updated",
  clear_value: "Cleared value",
  no_change: "No change",
  duplicate_candidate: "Duplicate candidate",
  error: "Error",
  skipped: "Skipped",
};

/** Preferred import fields for a readable row label, in priority order. */
const LABEL_FIELDS: Record<ImportObjectType, string[]> = {
  buildings: ["building_name_en", "address"],
  premises: ["premises_name", "building_name_en", "floor", "unit", "external_ref"],
  companies: ["company_name_en", "company_name_zh"],
  contacts: ["display_name", "chinese_name", "first_name", "email"],
  relationships: ["relationship_type", "from_entity_name", "to_entity_name"],
  opportunities: ["opportunity_name", "company_name_en", "requirement_summary"],
  opportunity_parties: ["contact_name", "company_name_en", "opportunity_name"],
  opportunity_proposed_premises: ["opportunity_name", "premises_name", "building_name_en"],
  activities: ["activity_type", "activity_date", "company_name_en", "notes"],
  activity_premises: ["activity_name", "premises_name", "building_name_en"],
};

export function formatImportActionLabel(action: string): string {
  return ACTION_LABELS[action as ImportRowAction] ?? action.replace(/_/g, " ");
}

export function formatFieldChangeValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  return String(value);
}

export function summarizeFieldChanges(changes: FieldChange[] | null | undefined): string {
  if (!changes?.length) return "—";
  return changes.map((c) => c.label || c.field).join(", ");
}

export function importRowRecordLabel(
  objectType: ImportObjectType,
  rawRow: Record<string, string> | null | undefined,
  columnMapping: Record<string, string>,
  matchedRecordId: string | null | undefined,
  matchedId: number | null | undefined,
): string {
  const valuesByField = mappedFieldValues(rawRow, columnMapping);

  const parts: string[] = [];
  for (const key of LABEL_FIELDS[objectType]) {
    const value = valuesByField[key]?.trim();
    if (!value) continue;
    if (key === "floor" || key === "unit") {
      parts.push(key === "unit" && !value.startsWith("#") ? `#${value}` : value);
      continue;
    }
    if (key === "first_name" && valuesByField.last_name?.trim()) {
      return `${value} ${valuesByField.last_name.trim()}`.trim();
    }
    return value;
  }

  if (parts.length > 0) {
    const building = valuesByField.building_name_en?.trim();
    return [building, ...parts].filter(Boolean).join(" · ");
  }

  const firstValue = Object.values(valuesByField).find((v) => v.trim());
  if (firstValue) return firstValue.trim();

  if (matchedRecordId?.trim()) return matchedRecordId.trim();
  if (matchedId != null) return String(matchedId);
  return "—";
}

export function importRowMatchedId(
  matchedRecordId: string | null | undefined,
  matchedId: number | null | undefined,
): string {
  if (matchedRecordId?.trim()) return matchedRecordId.trim();
  if (matchedId != null) return String(matchedId);
  return "—";
}

function mappedFieldValues(
  rawRow: Record<string, string> | null | undefined,
  columnMapping: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!rawRow) return out;
  for (const [csvCol, fieldKey] of Object.entries(columnMapping)) {
    if (!fieldKey || fieldKey === "__skip__") continue;
    if (!(csvCol in rawRow)) continue;
    out[fieldKey] = rawRow[csvCol] ?? "";
  }
  return out;
}

export function parseFieldChanges(raw: unknown): FieldChange[] | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw as FieldChange[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as FieldChange[]) : null;
    } catch {
      return null;
    }
  }
  return null;
}
