/** Canonical permanent business IDs for module CSV export. */

export function companyBusinessExportId(row: {
  id?: number;
  business_id?: string | null;
  v1_company_id?: string | null;
}): string {
  return row.business_id?.trim() || "";
}

export function contactBusinessExportId(row: {
  id?: number;
  business_id?: string | null;
  v1_contact_id?: string | null;
}): string {
  return row.business_id?.trim() || "";
}

export function buildingBusinessExportId(row: {
  property_id?: string;
  business_id?: string | null;
}): string {
  return row.business_id?.trim() || "";
}

export function premiseBusinessExportId(row: {
  premises_id?: string;
  business_id?: string | null;
}): string {
  return row.business_id?.trim() || "";
}
