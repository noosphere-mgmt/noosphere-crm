import { withAdminReturnTo } from "@/lib/adminReturnTo";
import { contactFullPageHref } from "@/lib/crmDetailNav";
import type { ContactWorkspaceTabId } from "@/lib/contactWorkspaceTab";

type ContactRef = {
  id: number;
  business_id?: string | null;
};

export function contactWorkspaceHref(
  contact: ContactRef,
  tab: ContactWorkspaceTabId = "overview",
  mode?: "edit",
  returnTo?: string | null,
): string {
  const businessId = contact.business_id?.trim() || String(contact.id);
  const href = contactFullPageHref(businessId, {
    tab: tab === "overview" ? undefined : tab,
    mode,
  });
  const base = href ?? `/admin/contacts/${encodeURIComponent(businessId)}`;
  return withAdminReturnTo(base, returnTo);
}
