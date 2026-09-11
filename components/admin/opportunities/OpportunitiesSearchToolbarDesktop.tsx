"use client";

import { OpportunitiesSalesCopilot } from "@/components/admin/opportunities/OpportunitiesSalesCopilot";
import { OpportunitiesViewScope } from "@/components/admin/opportunities/OpportunitiesViewScope";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListStatusFilter } from "@/lib/opportunitiesList";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunitiesSearchToolbarDesktop({
  searchQuery,
  onSearchChange,
  listStatusFilter,
  onListStatusFilterChange,
  usingLegacyStatusFilter,
  dashboardStage,
  rows,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listStatusFilter: OpportunitiesListStatusFilter;
  onListStatusFilterChange: (filter: OpportunitiesListStatusFilter) => void;
  usingLegacyStatusFilter?: boolean;
  dashboardStage?: string;
  rows: Opportunity[];
}) {
  const theme = moduleAccentClasses("opportunities");

  return (
    <div className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-1/3 min-w-0 shrink-0">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search client, company, contact, district, status…"
            aria-label="Search opportunities"
            className={theme.searchInput}
          />
        </div>
        <OpportunitiesSalesCopilot rows={rows} />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <OpportunitiesViewScope
          listStatusFilter={listStatusFilter}
          onListStatusFilterChange={onListStatusFilterChange}
          usingLegacyStatusFilter={usingLegacyStatusFilter}
        />
        {usingLegacyStatusFilter ? (
          <span className="text-xs text-slate-500">Pipeline filter from dashboard link</span>
        ) : dashboardStage ? (
          <span className="text-xs text-slate-500">
            Pipeline: {dashboardStage === "won_month" ? "Won this month" : dashboardStage === "no_footprint" ? "Without footprint" : "Viewing"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
