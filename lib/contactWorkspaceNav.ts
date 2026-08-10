import { contactFullPageHref } from "@/lib/crmDetailNav";
import type { ContactWorkspaceTabId } from "@/lib/contactWorkspaceTab";

type ContactRef = {
  id: number;
  business_id?: string | null;
};

export function contactWorkspaceHref(
  contact: ContactRef,
  tab: ContactWorkspaceTabId = "profile",
  mode?: "edit",
): string {
  const businessId = contact.business_id?.trim() || String(contact.id);
  const href = contactFullPageHref(businessId, {
    tab: tab === "profile" ? undefined : tab,
    mode,
  });
  return href ?? `/admin/contacts/${encodeURIComponent(businessId)}`;
}
