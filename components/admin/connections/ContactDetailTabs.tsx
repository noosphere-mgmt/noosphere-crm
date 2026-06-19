"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { connectionsTabClass } from "@/lib/connectionsGlassTheme";
import type { ContactDetailTabId } from "@/lib/contactDetailTab";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";

const tabs: { id: ContactDetailTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "company", label: "Company" },
  { id: "relationships", label: "Relationships" },
  { id: "activities", label: "Activities" },
  { id: "premises", label: "Properties" },
  { id: "opportunities", label: "Opportunities" },
  { id: "notes", label: "Notes" },
];

export function ContactDetailTabs({
  embedded = false,
  contactId,
}: {
  embedded?: boolean;
  contactId: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as ContactDetailTabId) || "overview";

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
        const href = contactDrawerHref(pathname, searchParams, contactId, tab.id);
        return (
          <Link key={tab.id} href={href} className={connectionsTabClass(active === tab.id)}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
