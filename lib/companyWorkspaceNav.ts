import { withAdminReturnTo } from "@/lib/adminReturnTo";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import type { CompanyWorkspaceTabId } from "@/lib/companyWorkspaceTab";

type CompanyRef = {
  id: number;
  business_id?: string | null;
};

export function companyWorkspaceHref(
  company: CompanyRef,
  tab: CompanyWorkspaceTabId = "overview",
  mode?: "edit",
  returnTo?: string | null,
): string {
  const businessId = company.business_id?.trim() || String(company.id);
  const href = companyFullPageHref(businessId, {
    tab: tab === "overview" ? undefined : tab,
    mode,
  });
  const base = href ?? `/admin/companies/${encodeURIComponent(businessId)}`;
  return withAdminReturnTo(base, returnTo);
}
