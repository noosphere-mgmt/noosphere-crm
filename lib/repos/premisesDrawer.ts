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
import { normalizePremisesDrawerData } from "@/lib/premisesClientData";
import { resolvePremisesV1Id } from "@/lib/repos/premisesV1";

export type PremisesDrawerData = {
  proposed: PremisesProposedOpportunityRow[];
  fees: PremisesFeeSummary;
  activities: ActivityListRow[];
  lastActivityDate: string | null;
};

const emptyDrawerData = (): PremisesDrawerData => ({
  proposed: [],
  fees: { expected_collect: 0, confirmed_collect: 0, paid_out: 0, net_fee: 0, lines: [] },
  activities: [],
  lastActivityDate: null,
});

export async function getPremisesDrawerData(premisesRef: string): Promise<PremisesDrawerData> {
  const premisesId = (await resolvePremisesV1Id(premisesRef)) ?? premisesRef.trim();
  if (!premisesId) return emptyDrawerData();

  const [proposed, fees, activities, lastActivityDate] = await Promise.all([
    listProposedPremisesForPremises(premisesId).catch(() => [] as PremisesProposedOpportunityRow[]),
    summarizePremisesFees(premisesId).catch(() => emptyDrawerData().fees),
    listActivitiesForPremises(premisesId).catch(() => [] as ActivityListRow[]),
    getLastActivityDateForPremises(premisesId).catch(() => null),
  ]);
  return normalizePremisesDrawerData({
    proposed,
    fees,
    activities,
    lastActivityDate,
  });
}
