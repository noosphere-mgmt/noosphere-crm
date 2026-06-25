/**
 * Verify import/export CSVs use permanent business IDs only (C/D/B/P/M/A######).
 * Usage: npm run verify:company-export-ids
 */
import "./ensure-env";
import { BUSINESS_ID_PREFIX, type BusinessEntityType } from "../lib/businessIds";
import { parseCsv } from "../lib/import/parseCsv";
import { exportObjectCsv } from "../lib/import/templates";
import type { ImportObjectType } from "../lib/import/types";

const LEGACY_PATTERNS = [
  { re: /COMP-\d{4}-/i, label: "COMP- legacy company id" },
  { re: /INV-\d{4}-/i, label: "INV- legacy premise id" },
  { re: /BLDG-\d{4}-/i, label: "BLDG- legacy building id" },
];

const NUMERIC_ONLY_RE = /^\d+$/;

const COLUMN_ENTITY: Record<string, BusinessEntityType> = {
  company_id: "company",
  primary_contact_id: "contact",
  contact_id: "contact",
  assigned_contact_id: "contact",
  building_id: "building",
  premises_id: "premise",
  opportunity_id: "opportunity",
  activity_id: "activity",
};

function entityForColumn(column: string): BusinessEntityType | null {
  if (column in COLUMN_ENTITY) return COLUMN_ENTITY[column]!;
  if (column.endsWith("_company_id")) return "company";
  if (column.endsWith("_contact_id")) return "contact";
  return null;
}

function businessIdRe(entityType: BusinessEntityType): RegExp {
  const prefix = BUSINESS_ID_PREFIX[entityType].prefix;
  return new RegExp(`^${prefix}\\d{6}$`);
}

/** Internal row keys that may remain numeric — not user-facing business IDs. */
const SKIP_COLUMNS = new Set([
  "opportunity_party_id",
  "opportunity_premises_id",
  "activity_checkpoint_id",
  "external_ref",
]);

function assertBusinessIdValue(
  objectType: ImportObjectType,
  column: string,
  entityType: BusinessEntityType,
  rowIndex: number,
  value: string,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  for (const legacy of LEGACY_PATTERNS) {
    if (legacy.re.test(trimmed)) {
      return `${objectType} row ${rowIndex + 1} ${column}=${trimmed} (${legacy.label})`;
    }
  }

  if (NUMERIC_ONLY_RE.test(trimmed)) {
    return `${objectType} row ${rowIndex + 1} ${column}=${trimmed} (numeric-only id)`;
  }

  if (!businessIdRe(entityType).test(trimmed)) {
    return `${objectType} row ${rowIndex + 1} ${column}=${trimmed} (not ${BUSINESS_ID_PREFIX[entityType].prefix}###### format)`;
  }

  return null;
}

const EXPORT_OBJECT_TYPES: ImportObjectType[] = [
  "companies",
  "contacts",
  "buildings",
  "premises",
  "opportunities",
  "activities",
  "opportunity_parties",
  "opportunity_proposed_premises",
];

async function verifyExport(objectType: ImportObjectType): Promise<string[]> {
  const errors: string[] = [];
  const csv = await exportObjectCsv(objectType);

  for (const legacy of LEGACY_PATTERNS) {
    if (legacy.re.test(csv)) {
      errors.push(`${objectType}: CSV contains ${legacy.label}`);
    }
  }

  const parsed = parseCsv(csv);
  const idColumns = parsed.headers.filter(
    (h) => (h.endsWith("_id") || h === "company_id") && !SKIP_COLUMNS.has(h),
  );

  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i]!;
    for (const col of idColumns) {
      const entityType = entityForColumn(col);
      if (!entityType) continue;
      const err = assertBusinessIdValue(objectType, col, entityType, i, String(row[col] ?? ""));
      if (err) errors.push(err);
    }
  }

  const sample = parsed.rows
    .flatMap((row) =>
      idColumns
        .map((col) => String(row[col] ?? "").trim())
        .filter(Boolean),
    )
    .slice(0, 4);
  console.log(`OK  ${objectType} (${parsed.rows.length} rows, sample ids: ${sample.join(", ") || "—"})`);
  return errors;
}

async function main(): Promise<void> {
  const allErrors: string[] = [];
  for (const objectType of EXPORT_OBJECT_TYPES) {
    try {
      const errors = await verifyExport(objectType);
      allErrors.push(...errors);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      allErrors.push(`${objectType}: export failed — ${message}`);
    }
  }

  if (allErrors.length > 0) {
    console.error("\nverify-company-export-ids: FAILED");
    for (const err of allErrors) console.error(`  - ${err}`);
    process.exit(1);
  }

  console.log("\nverify-company-export-ids: OK — all exports use permanent business IDs");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
