import { query } from "@/lib/db";
import { countOpenLinkedOpportunitiesForCompany } from "@/lib/repos/connectionOpportunities";
import { listCompanyLinkedProperties } from "@/lib/repos/companyLinkedProperties";

export type CompanyCrmSummary = {
  contacts: number;
  properties: number;
  premises: number;
  openOpportunities: number;
};

export async function getCompanyCrmSummary(legacyCompanyId: number): Promise<CompanyCrmSummary> {
  const [contactRows, openOpportunities, linkedProperties] = await Promise.all([
    query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM contacts WHERE company_id = $1 AND is_active = TRUE`,
      [legacyCompanyId],
    ),
    countOpenLinkedOpportunitiesForCompany(legacyCompanyId),
    listCompanyLinkedProperties(legacyCompanyId).catch(() => []),
  ]);

  return {
    contacts: contactRows[0]?.n ?? 0,
    properties: linkedProperties.filter((row) => row.kind === "building").length,
    premises: linkedProperties.filter((row) => row.kind === "premise").length,
    openOpportunities,
  };
}
