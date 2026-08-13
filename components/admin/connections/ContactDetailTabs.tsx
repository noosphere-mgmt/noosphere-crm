"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { connectionsTabClass } from "@/lib/connectionsGlassTheme";
import { getContactTab, type ContactDetailTabId } from "@/lib/contactDetailTab";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { contactFullPageHref } from "@/lib/crmDetailNav";

const tabs: { id: ContactDetailTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "company", label: "Company" },
  { id: "relationships", label: "Relationships" },
  { id: "activities", label: "Activities" },
  { id: "premises", label: "Properties" },
  { id: "opportunities", label: "Opportunities" },
];

export function ContactDetailTabs({
  embedded = false,
  contactId,
  businessId,
}: {
  embedded?: boolean;
  contactId: number;
  businessId?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = getContactTab({ tab: searchParams.get("tab") ?? undefined });
  const onFullPage = Boolean(businessId) || pathname.startsWith("/admin/contacts/");

  return (
    <nav
      aria-label="Contact sections"
      className={
        embedded
          ? "flex flex-wrap items-center gap-1 border-b border-slate-200 pb-1.5 text-sm"
          : "mb-4 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm"
      }
    >
      {tabs.map((tab) => {
        const href =
          onFullPage && businessId
            ? contactFullPageHref(businessId, { tab: tab.id }) ??
              contactDrawerHref("/admin/contacts", searchParams, contactId, tab.id)
            : onFullPage
              ? withDetailQs(pathname, tab.id)
              : contactDrawerHref(
                  pathname.startsWith("/admin/contacts") ? "/admin/contacts" : pathname,
                  searchParams,
                  contactId,
                  tab.id,
                );
        return (
          <Link key={tab.id} href={href} className={connectionsTabClass(active === tab.id)}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function withDetailQs(pathname: string, tab: ContactDetailTabId): string {
  const params = new URLSearchParams();
  if (tab !== "overview") params.set("tab", tab);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
