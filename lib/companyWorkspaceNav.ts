import { companyFullPageHref } from "@/lib/crmDetailNav";
import type { CompanyWorkspaceTabId } from "@/lib/companyWorkspaceTab";

type CompanyRef = {
  id: number;
  business_id?: string | null;
};

export function companyWorkspaceHref(
  company: CompanyRef,
  tab: CompanyWorkspaceTabId = "profile",
  mode?: "edit",
): string {
  const businessId = company.business_id?.trim() || String(company.id);
  const href = companyFullPageHref(businessId, {
    tab: tab === "profile" ? undefined : tab,
    mode,
  });
  return href ?? `/admin/companies/${encodeURIComponent(businessId)}`;
}
