import { opportunityFullPageHref } from "@/lib/crmDetailNav";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import type { OpportunityWorkspaceTabId } from "@/lib/opportunityDetailTab";

type OpportunityRef = {
  id: number;
  business_id?: string | null;
  v1_opportunity_id?: string | null;
};

export function opportunityWorkspaceHref(
  opportunity: OpportunityRef,
  tab: OpportunityWorkspaceTabId = "overview",
  mode?: "edit",
): string {
  const businessId = opportunity.business_id ?? opportunity.v1_opportunity_id ?? null;
  const fromBusinessId = opportunityFullPageHref(businessId, { tab, mode });
  if (fromBusinessId) return fromBusinessId;
  return opportunityDetailHref(opportunity.id, tab, mode, businessId);
}
