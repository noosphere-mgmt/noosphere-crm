import type { OpportunityDetailTabId } from "@/lib/opportunityDetailTab";

export function opportunityDetailHref(
  opportunityId: number,
  tab: OpportunityDetailTabId = "overview",
  mode?: "edit",
): string {
  const params = new URLSearchParams();
  if (tab !== "overview") params.set("tab", tab);
  if (mode === "edit") params.set("mode", "edit");
  const qs = params.toString();
  return qs ? `/admin/opportunities/${opportunityId}?${qs}` : `/admin/opportunities/${opportunityId}`;
}
