"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  OPPORTUNITY_WORKSPACE_TABS,
  PROF_SERVICE_HIDDEN_WORKSPACE_TABS,
  getOpportunityTab,
} from "@/lib/opportunityDetailTab";
import { isProfServiceSalesRole, type OpportunitySalesRole } from "@/lib/opportunityValues";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { opportunityDrawerHref } from "@/lib/opportunitiesDrawerNav";

const DRAWER_HIDDEN_TABS = new Set(["documents"]);

export function OpportunityDetailTabs({
  opportunityId,
  businessId,
  salesRole,
  variant = "page",
}: {
  opportunityId: number;
  businessId?: string | null;
  salesRole?: OpportunitySalesRole | null;
  variant?: "page" | "drawer";
}) {
  const searchParams = useSearchParams();
  const active = getOpportunityTab({ tab: searchParams.get("tab") });
  const hideProfServiceTabs = isProfServiceSalesRole(salesRole);

  const tabs = OPPORTUNITY_WORKSPACE_TABS.filter(
    (t) => !(variant === "drawer" && DRAWER_HIDDEN_TABS.has(t.id)),
  ).filter((t) => !(hideProfServiceTabs && PROF_SERVICE_HIDDEN_WORKSPACE_TABS.has(t.id)));

  const opportunityRef = {
    id: opportunityId,
    business_id: businessId,
    v1_opportunity_id: businessId,
  };

  return (
    <nav className="flex flex-wrap gap-0.5 border-b border-slate-200 pb-1.5" aria-label="Opportunity sections">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const href =
          variant === "page"
            ? opportunityWorkspaceHref(opportunityRef, tab.id)
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
          href={opportunityWorkspaceHref(opportunityRef, "overview")}
          className="ml-auto hidden rounded-md px-2.5 py-1 text-sm font-medium text-emerald-800 hover:bg-[rgba(16,185,129,0.08)] sm:inline-flex"
        >
          Open workspace →
        </Link>
      ) : null}
    </nav>
  );
}
