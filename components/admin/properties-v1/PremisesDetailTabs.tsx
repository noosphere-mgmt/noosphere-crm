"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { moduleTabClass } from "@/components/admin/moduleTheme";
import type { PremisesDetailTabId } from "@/lib/premisesDetailTab";
import { premisesDrawerHref } from "@/lib/premisesDrawerNav";

const TAB_DEFS: { id: PremisesDetailTabId; label: string; countKey?: "relationships" | "opportunities" | "fees" }[] = [
  { id: "overview", label: "Overview" },
  { id: "relationships", label: "Relationships", countKey: "relationships" },
  { id: "opportunities", label: "Opportunities", countKey: "opportunities" },
  { id: "fees", label: "Fees", countKey: "fees" },
  { id: "activities", label: "Activities" },
  { id: "notes", label: "Notes" },
];

export function PremisesDetailTabs({
  premisesId,
  counts,
  drawerBasePath = "/admin/properties",
}: {
  premisesId: string;
  counts: { relationships: number; opportunities: number; fees: number };
  drawerBasePath?: string;
}) {
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as PremisesDetailTabId) || "overview";

  return (
    <nav
      aria-label="Premises sections"
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-1.5 text-sm"
    >
      {TAB_DEFS.map((tab) => {
        const href = premisesDrawerHref(searchParams, premisesId, tab.id, "view", drawerBasePath);
        const count =
          tab.countKey === "relationships"
            ? counts.relationships
            : tab.countKey === "opportunities"
              ? counts.opportunities
              : tab.countKey === "fees"
                ? counts.fees
                : 0;
        return (
          <Link key={tab.id} href={href} className={moduleTabClass("properties", active === tab.id)}>
            {tab.label}
            {tab.countKey && count > 0 ? ` ${count}` : ""}
          </Link>
        );
      })}
    </nav>
  );
}
