import type { PremisesRelationshipLine } from "@/lib/v1ListValues";
import {
  normalizePremisesV1ContactIdForDb,
  normalizePropertyV1CompanyIdForDb,
} from "@/lib/propertyCompanyFields";

/** Server-only: normalize relationship line refs for premises_v1 TEXT FK columns. */
export async function normalizeRelationshipLinesForSave(
  lines: PremisesRelationshipLine[],
): Promise<PremisesRelationshipLine[]> {
  const normalized: PremisesRelationshipLine[] = [];
  for (const line of lines) {
    const company_id = line.company_id?.trim()
      ? await normalizePropertyV1CompanyIdForDb(line.company_id)
      : null;
    const contact_id = line.contact_id?.trim()
      ? await normalizePremisesV1ContactIdForDb(line.contact_id)
      : null;
    normalized.push({ ...line, company_id, contact_id });
  }
  return normalized;
}
