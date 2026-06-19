import { query } from "@/lib/db";

/** Keep denormalized opportunity.company_name in sync when the canonical name changes. */
export async function propagateCompanyRename(legacyId: number, companyName: string): Promise<void> {
  const name = companyName.trim();
  if (!name) return;

  await query(
    `UPDATE opportunities SET company_name = $2 WHERE company_id = $1`,
    [legacyId, name],
  );
}
