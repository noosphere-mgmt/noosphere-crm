import { listCompanyOptions } from "@/lib/repos/companies";
import { listContactOptions } from "@/lib/repos/contacts";
import { getOpportunity } from "@/lib/repos/opportunities";
import { listProposedPremisesForOpportunity } from "@/lib/repos/opportunityProposedPremises";
import type { Opportunity } from "@/lib/types/entities";

export type OpportunityDrawerData = {
  opportunity: Opportunity;
  proposedCount: number;
  companies: Awaited<ReturnType<typeof listCompanyOptions>>;
  contacts: Awaited<ReturnType<typeof listContactOptions>>;
};

export async function getOpportunityDrawerData(id: number): Promise<OpportunityDrawerData | null> {
  const opportunity = await getOpportunity(id);
  if (!opportunity) return null;

  const [proposedPremises, companies, contacts] = await Promise.all([
    listProposedPremisesForOpportunity(id),
    listCompanyOptions(),
    listContactOptions(),
  ]);

  return {
    opportunity,
    proposedCount: proposedPremises.length,
    companies,
    contacts,
  };
}
