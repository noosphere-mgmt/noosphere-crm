"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { connectionsTabClass } from "@/lib/connectionsGlassTheme";
import type { CompanyDetailTabId } from "@/lib/companyDetailTab";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import { companyFullPageHref } from "@/lib/crmDetailNav";

const tabs: { id: CompanyDetailTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "contacts", label: "Contacts" },
  { id: "relationships", label: "Relationships" },
  { id: "opportunities", label: "Opportunities" },
  { id: "activities", label: "Activities" },
  { id: "premises", label: "Properties" },
];

export function CompanyDetailTabs({
  embedded = false,
  companyId,
  businessId,
}: {
  embedded?: boolean;
  companyId: number;
  /** When set, tab links stay on the full detail page. */
  businessId?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as CompanyDetailTabId) || "overview";
  const onFullPage = Boolean(businessId) || pathname.startsWith("/admin/companies/");

  return (
    <nav
      aria-label="Company sections"
      className={
        embedded
          ? "flex flex-wrap items-center gap-1 border-b border-slate-200 pb-1.5 text-sm"
          : "mb-4 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm"
      }
    >
      {tabs.map((tab) => {
        const href =
          onFullPage && businessId
            ? companyFullPageHref(businessId, { tab: tab.id }) ?? companyDrawerHref("/admin/companies", searchParams, companyId, tab.id)
            : onFullPage
              ? withDetailQs(pathname, tab.id)
              : companyDrawerHref(pathname.startsWith("/admin/companies") ? "/admin/companies" : pathname, searchParams, companyId, tab.id);
        return (
          <Link key={tab.id} href={href} className={connectionsTabClass(active === tab.id)}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

function withDetailQs(pathname: string, tab: CompanyDetailTabId): string {
  const params = new URLSearchParams();
  if (tab !== "overview") params.set("tab", tab);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
