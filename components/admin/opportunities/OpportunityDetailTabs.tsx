"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { OPPORTUNITY_DETAIL_TABS, getOpportunityTab } from "@/lib/opportunityDetailTab";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { opportunityDrawerHref } from "@/lib/opportunitiesDrawerNav";
import { useIsMobile } from "@/lib/useIsMobile";

const MOBILE_HIDDEN_TABS = new Set(["proposals"]);

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
    ? OPPORTUNITY_DETAIL_TABS.filter((t) => !MOBILE_HIDDEN_TABS.has(t.id))
    : OPPORTUNITY_DETAIL_TABS;
  const tabs = variant === "drawer" ? pageTabs.filter((t) => t.id === "overview") : pageTabs;

  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200 pb-2" aria-label="Opportunity sections">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const href =
          variant === "page"
            ? opportunityDetailHref(opportunityId, tab.id)
            : opportunityDrawerHref(searchParams, opportunityId, tab.id as "overview");
        return (
          <Link
            key={tab.id}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
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
          className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-[rgba(16,185,129,0.08)]"
        >
          Open full page →
        </Link>
      ) : null}
    </nav>
  );
}
