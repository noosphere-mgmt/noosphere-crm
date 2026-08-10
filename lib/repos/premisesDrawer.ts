import { listActivitiesForPremises, type ActivityListRow } from "@/lib/repos/activities";
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

export async function getPremisesDrawerData(premisesRef: string, alreadyResolved = false): Promise<PremisesDrawerData> {
  const premisesId = alreadyResolved
    ? premisesRef.trim()
    : (await resolvePremisesV1Id(premisesRef)) ?? premisesRef.trim();
  if (!premisesId) return emptyDrawerData();

  const [proposed, fees, activities] = await Promise.all([
    listProposedPremisesForPremises(premisesId).catch(() => [] as PremisesProposedOpportunityRow[]),
    summarizePremisesFees(premisesId).catch(() => emptyDrawerData().fees),
    listActivitiesForPremises(premisesId).catch(() => [] as ActivityListRow[]),
  ]);
  const lastActivityDate = activities.reduce<string | null>((latest, row) => {
    const value = row.activity_date?.trim();
    return value && (!latest || value > latest) ? value : latest;
  }, null);
  return normalizePremisesDrawerData({
    proposed,
    fees,
    activities,
    lastActivityDate,
  });
}
