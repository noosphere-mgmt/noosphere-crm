/** Canonical business id for module CSV export (COMP-* / CONT-*). */

export function companyBusinessExportId(row: {
  id: number;
  v1_company_id?: string | null;
}): string {
  return row.v1_company_id?.trim() || String(row.id);
}

export function contactBusinessExportId(row: {
  id: number;
  v1_contact_id?: string | null;
}): string {
  return row.v1_contact_id?.trim() || String(row.id);
}
