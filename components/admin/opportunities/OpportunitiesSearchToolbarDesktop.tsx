"use client";

import { OpportunitiesStatusFilterPills } from "@/components/admin/opportunities/OpportunitiesStatusFilterPills";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListStatusFilter } from "@/lib/opportunitiesList";

export function OpportunitiesSearchToolbarDesktop({
  searchQuery,
  onSearchChange,
  listStatusFilter,
  onListStatusFilterChange,
  statusFilterCounts,
  usingLegacyStatusFilter,
  dashboardStage,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listStatusFilter: OpportunitiesListStatusFilter;
  onListStatusFilterChange: (filter: OpportunitiesListStatusFilter) => void;
  statusFilterCounts: Record<OpportunitiesListStatusFilter, number>;
  usingLegacyStatusFilter?: boolean;
  dashboardStage?: string;
}) {
  const theme = moduleAccentClasses("opportunities");

  return (
    <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search client, company, contact, district, status…"
        aria-label="Search opportunities"
        className={theme.searchInput}
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-xs font-medium text-slate-500">Status</span>
        <OpportunitiesStatusFilterPills
          listStatusFilter={listStatusFilter}
          onListStatusFilterChange={onListStatusFilterChange}
          counts={statusFilterCounts}
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
