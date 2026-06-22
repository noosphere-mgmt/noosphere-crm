"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OPPORTUNITY_DETAIL_TABS, getOpportunityTab } from "@/lib/opportunityDetailTab";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { opportunityDrawerHref } from "@/lib/opportunitiesDrawerNav";
import { useIsMobile } from "@/lib/useIsMobile";

const DRAWER_HIDDEN_TABS = new Set(["proposals"]);

export function OpportunityDetailTabs({
  opportunityId,
  variant = "page",
}: {
  opportunityId: number;
  variant?: "page" | "drawer";
}) {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const active = getOpportunityTab({ tab: searchParams.get("tab") });

  const pageTabs = isMobile
    ? OPPORTUNITY_DETAIL_TABS.filter((t) => !DRAWER_HIDDEN_TABS.has(t.id))
    : OPPORTUNITY_DETAIL_TABS;

  const tabs =
    variant === "drawer"
      ? pageTabs.filter((t) => !DRAWER_HIDDEN_TABS.has(t.id))
      : pageTabs;

  return (
    <nav className="flex flex-wrap gap-0.5 border-b border-slate-200 pb-1.5" aria-label="Opportunity sections">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const href =
          variant === "page"
            ? opportunityDetailHref(opportunityId, tab.id)
            : opportunityDrawerHref(searchParams, opportunityId, tab.id);
        return (
          <Link
            key={tab.id}
            href={href}
            className={`rounded-md px-2.5 py-1 text-sm font-medium transition ${
              isActive
                ? "bg-[rgba(16,185,129,0.12)] text-emerald-800"
                : "text-slate-600 hover:bg-[rgba(16,185,129,0.08)] hover:text-emerald-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      {variant === "drawer" ? (
        <Link
          href={opportunityDetailHref(opportunityId)}
          className="ml-auto hidden rounded-md px-2.5 py-1 text-sm font-medium text-emerald-800 hover:bg-[rgba(16,185,129,0.08)] sm:inline-flex"
        >
          Full page →
        </Link>
      ) : null}
    </nav>
  );
}
