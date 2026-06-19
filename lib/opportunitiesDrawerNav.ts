import type { OpportunityDetailTabId } from "@/lib/opportunityDetailTab";

export function buildOpportunitiesReturnTo(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("opportunity");
  params.delete("tab");
  params.delete("mode");
  params.delete("new");
  params.delete("company_id");
  const qs = params.toString();
  return qs ? `/admin/opportunities?${qs}` : "/admin/opportunities";
}

export function opportunityDrawerHref(
  searchParams: URLSearchParams,
  opportunityId: number,
  tab: OpportunityDetailTabId = "overview",
  mode?: "edit",
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("opportunity", String(opportunityId));
  params.delete("new");
  params.delete("company_id");
  if (tab === "overview") params.delete("tab");
  else params.set("tab", tab);
  if (mode === "edit") params.set("mode", "edit");
  else params.delete("mode");
  return `/admin/opportunities?${params.toString()}`;
}

export function opportunityCreateHref(searchParams: URLSearchParams, companyId?: number): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("new", "1");
  params.delete("opportunity");
  params.delete("tab");
  params.delete("mode");
  if (companyId && companyId > 0) params.set("company_id", String(companyId));
  else params.delete("company_id");
  return `/admin/opportunities?${params.toString()}`;
}
