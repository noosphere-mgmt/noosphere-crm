import { listCompanyOptions } from "@/lib/repos/companies";
import { listContactOptions } from "@/lib/repos/contacts";
import { getOpportunity } from "@/lib/repos/opportunities";
import { listOpportunityParties } from "@/lib/repos/opportunityParties";
import {
  getLastActivityDateForOpportunity,
  listActivitiesForOpportunity,
  type ActivityListRow,
} from "@/lib/repos/activities";
import { listProposedPremisesForOpportunity } from "@/lib/repos/opportunityProposedPremises";
import { summarizePartyFees, type OpportunityFeeSummary } from "@/lib/opportunityPartiesDisplay";
import type { Opportunity, OpportunityParty, OpportunityProposedPremises } from "@/lib/types/entities";

export type OpportunityDetailData = {
  opportunity: Opportunity;
  proposedPremises: OpportunityProposedPremises[];
  parties: OpportunityParty[];
  feeSummary: OpportunityFeeSummary;
  companies: Awaited<ReturnType<typeof listCompanyOptions>>;
  contacts: Awaited<ReturnType<typeof listContactOptions>>;
  activities: ActivityListRow[];
  lastActivityDate: string | null;
};

export async function getOpportunityDetailData(id: number): Promise<OpportunityDetailData | null> {
  const opportunity = await getOpportunity(id);
  if (!opportunity) return null;

  const [proposedPremises, parties, companies, contacts, activities, lastActivityDate] = await Promise.all([
    listProposedPremisesForOpportunity(id),
    listOpportunityParties(id),
    listCompanyOptions(),
    listContactOptions(),
    listActivitiesForOpportunity(id).catch(() => [] as ActivityListRow[]),
    getLastActivityDateForOpportunity(id).catch(() => null),
  ]);

  const feeSummary = summarizePartyFees(parties);

  return { opportunity, proposedPremises, parties, feeSummary, companies, contacts, activities, lastActivityDate };
}
