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
import type { Opportunity, OpportunityParty, OpportunityProposal, OpportunityProposedPremises } from "@/lib/types/entities";
import { listProposalsForOpportunity } from "@/lib/repos/opportunityProposals";
import { listOpportunityDocuments, type OpportunityDocument } from "@/lib/repos/opportunityDocuments";

export type OpportunityDetailData = {
  opportunity: Opportunity;
  proposedPremises: OpportunityProposedPremises[];
  proposals: OpportunityProposal[];
  parties: OpportunityParty[];
  feeSummary: OpportunityFeeSummary;
  companies: Awaited<ReturnType<typeof listCompanyOptions>>;
  contacts: Awaited<ReturnType<typeof listContactOptions>>;
  activities: ActivityListRow[];
  lastActivityDate: string | null;
  documents: OpportunityDocument[];
};

export async function getOpportunityDetailData(id: number): Promise<OpportunityDetailData | null> {
  const opportunity = await getOpportunity(id);
  if (!opportunity) return null;

  const [proposedPremises, parties, companies, activities, lastActivityDate, proposals, documents] =
    await Promise.all([
    listProposedPremisesForOpportunity(id),
    listOpportunityParties(id),
    listCompanyOptions(),
    listActivitiesForOpportunity(id).catch(() => [] as ActivityListRow[]),
    getLastActivityDateForOpportunity(id).catch(() => null),
    listProposalsForOpportunity(id).catch(() => []),
    listOpportunityDocuments(id).catch(() => []),
  ]);

  const contacts = await listContactOptions([
    opportunity.primary_contact_id,
    opportunity.referrer_contact_id,
    ...parties.map((party) => party.contact_id),
  ]);

  const feeSummary = summarizePartyFees(parties);

  return { opportunity, proposedPremises, proposals, parties, feeSummary, companies, contacts, activities, lastActivityDate, documents };
}
