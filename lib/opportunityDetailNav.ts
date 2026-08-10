import type { OpportunityWorkspaceTabId } from "@/lib/opportunityDetailTab";
import { opportunityFullPageHref } from "@/lib/crmDetailNav";

/** Prefer business ID when available; falls back to numeric id for legacy callers. */
export function opportunityDetailHref(
  opportunityId: number | string,
  tab: OpportunityWorkspaceTabId = "overview",
  mode?: "edit",
  businessId?: string | null,
): string {
  if (businessId?.trim()) {
    return opportunityFullPageHref(businessId, { tab, mode }) ?? `/admin/opportunities/${opportunityId}`;
  }
  const params = new URLSearchParams();
  if (tab !== "overview") params.set("tab", tab);
  if (mode === "edit") params.set("mode", "edit");
  const qs = params.toString();
  return qs ? `/admin/opportunities/${opportunityId}?${qs}` : `/admin/opportunities/${opportunityId}`;
}
