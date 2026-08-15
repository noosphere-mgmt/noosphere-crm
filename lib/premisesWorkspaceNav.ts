import { premisesFullPageHref } from "@/lib/crmDetailNav";
import { withAdminReturnTo } from "@/lib/adminReturnTo";
import type { PremisesWorkspaceTabId } from "@/lib/premisesWorkspaceTab";

type PremisesRef = {
  premises_id: string;
  business_id?: string | null;
};

export function premisesWorkspaceHref(
  premises: PremisesRef,
  tab: PremisesWorkspaceTabId = "overview",
  mode?: "edit",
  returnTo?: string | null,
): string {
  const businessId = premises.business_id?.trim() || premises.premises_id;
  const href = premisesFullPageHref(businessId, { tab: tab === "overview" ? undefined : tab, mode });
  const base = href ?? `/admin/properties/premises/${encodeURIComponent(businessId)}`;
  return withAdminReturnTo(base, returnTo);
}
