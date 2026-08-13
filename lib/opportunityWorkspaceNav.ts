import { withAdminReturnTo } from "@/lib/adminReturnTo";
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
  returnTo?: string | null,
): string {
  const businessId = opportunity.business_id ?? opportunity.v1_opportunity_id ?? null;
  const fromBusinessId = opportunityFullPageHref(businessId, { tab, mode });
  const base = fromBusinessId ?? opportunityDetailHref(opportunity.id, tab, mode, businessId);
  return withAdminReturnTo(base, returnTo);
}
