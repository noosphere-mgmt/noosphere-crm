import { asArray } from "@/lib/asArray";
import { syncRelationshipColumns } from "@/lib/premisesRelationships";
import { relationshipLineHasContent } from "@/lib/premisesRelationships";
import { normalizeRelationshipLinesForSave } from "@/lib/premisesRelationshipsServer";
import type { PremisesV1Patch } from "@/lib/repos/premisesV1";
import type { PremisesRelationshipLine } from "@/lib/v1ListValues";

/** Normalize relationship lines and sync legacy company/contact columns on premises_v1. */
export async function buildPremisesRelationshipLinesPatch(
  lines: unknown,
): Promise<PremisesV1Patch> {
  const filtered = asArray<PremisesRelationshipLine>(lines).filter(relationshipLineHasContent);
  const normalized = await normalizeRelationshipLinesForSave(filtered);
  const synced = syncRelationshipColumns(normalized);
  return {
    relationship_lines: normalized,
    operator_company_id: synced.operator_company_id,
    owner_company_id: synced.owner_company_id,
    landlord_company_id: synced.landlord_company_id,
    current_tenant_company_id: synced.current_tenant_company_id,
    source_company_id: synced.source_company_id,
    source_contact_id: synced.source_contact_id,
    source_contact_role: synced.source_contact_role,
    source_url: synced.source_url,
    source_file: synced.source_file,
  };
}
