"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { connectionsTabClass } from "@/lib/connectionsGlassTheme";
import type { CompanyDetailTabId } from "@/lib/companyDetailTab";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";

const tabs: { id: CompanyDetailTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "contacts", label: "Contacts" },
  { id: "relationships", label: "Relationships" },
  { id: "opportunities", label: "Opportunities" },
  { id: "activities", label: "Activities" },
  { id: "premises", label: "Properties" },
  { id: "notes", label: "Notes" },
];

export function CompanyDetailTabs({
  embedded = false,
  companyId,
}: {
  embedded?: boolean;
  companyId: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as CompanyDetailTabId) || "overview";

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
        const href = companyDrawerHref(pathname, searchParams, companyId, tab.id);
        return (
          <Link key={tab.id} href={href} className={connectionsTabClass(active === tab.id)}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
