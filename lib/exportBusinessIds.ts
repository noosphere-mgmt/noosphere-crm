/** Canonical permanent business IDs for module CSV export. Never fall through to legacy/v1/PK. */

export function companyBusinessExportId(row: {
  business_id?: string | null;
}): string {
  return row.business_id?.trim() || "";
}

export function contactBusinessExportId(row: {
  business_id?: string | null;
}): string {
  return row.business_id?.trim() || "";
}

export function buildingBusinessExportId(row: {
  business_id?: string | null;
}): string {
  return row.business_id?.trim() || "";
}

export function premiseBusinessExportId(row: {
  business_id?: string | null;
}): string {
  return row.business_id?.trim() || "";
}
