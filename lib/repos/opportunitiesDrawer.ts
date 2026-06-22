import { lookupV1OpportunityId } from "@/lib/opportunityDrawerResolve";
import { getOpportunityDetailData, type OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export type OpportunityDrawerData = OpportunityDetailData & {
  v1OpportunityId: string | null;
};

export async function getOpportunityDrawerData(id: number): Promise<OpportunityDrawerData | null> {
  const detail = await getOpportunityDetailData(id);
  if (!detail) return null;

  const v1OpportunityId = await lookupV1OpportunityId(id);
  return { ...detail, v1OpportunityId };
}
