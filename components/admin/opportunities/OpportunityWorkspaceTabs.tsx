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

const TAB_TONES = {
  overview: { active: "border-blue-600 bg-blue-600 text-white", idle: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100" },
  parties: { active: "border-violet-600 bg-violet-600 text-white", idle: "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100" },
  proposed: { active: "border-emerald-600 bg-emerald-600 text-white", idle: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" },
  timeline: { active: "border-amber-500 bg-amber-500 text-white", idle: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100" },
  documents: { active: "border-rose-500 bg-rose-500 text-white", idle: "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100" },
} as const;

export function OpportunityWorkspaceTabs({
  opportunity,
  returnTo,
}: {
  opportunity: {
    id: number;
    business_id?: string | null;
    v1_opportunity_id?: string | null;
    sales_role?: OpportunitySalesRole | null;
  };
  returnTo?: string | null;
}) {
  const searchParams = useSearchParams();
  const active = getOpportunityTab({ tab: searchParams.get("tab") });
  const hideProfServiceTabs = isProfServiceSalesRole(opportunity.sales_role);

  const tabs = OPPORTUNITY_WORKSPACE_TABS.filter(
    (t) => !(hideProfServiceTabs && PROF_SERVICE_HIDDEN_WORKSPACE_TABS.has(t.id)),
  );

  return (
    <nav className="mb-2 flex w-max items-end gap-1 border-b border-slate-300 px-0.5 pt-1 sm:px-1" aria-label="Opportunity workspace sections">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const href = opportunityWorkspaceHref(opportunity, tab.id, undefined, returnTo);
        const tone = TAB_TONES[tab.id];
        return (
          <Link
            key={tab.id}
            href={href}
            className={`relative -mb-px whitespace-nowrap rounded-t-lg border border-b-0 px-3 py-2 text-center text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 sm:px-4 sm:text-sm ${isActive ? `${tone.active} pb-2.5` : tone.idle}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
