import {
  getLastActivityDateForPremises,
  listActivitiesForPremises,
  type ActivityListRow,
} from "@/lib/repos/activities";
import {
  listProposedPremisesForPremises,
  summarizePremisesFees,
  type PremisesFeeSummary,
  type PremisesProposedOpportunityRow,
} from "@/lib/repos/opportunityProposedPremises";

export type PremisesDrawerData = {
  proposed: PremisesProposedOpportunityRow[];
  fees: PremisesFeeSummary;
  activities: ActivityListRow[];
  lastActivityDate: string | null;
};

export async function getPremisesDrawerData(premisesId: string): Promise<PremisesDrawerData> {
  const [proposed, fees, activities, lastActivityDate] = await Promise.all([
    listProposedPremisesForPremises(premisesId),
    summarizePremisesFees(premisesId),
    listActivitiesForPremises(premisesId),
    getLastActivityDateForPremises(premisesId),
  ]);
  return { proposed, fees, activities, lastActivityDate };
}
