"use client";

import {
  OPPORTUNITY_PRIMARY_FILTER_LABELS,
  OPPORTUNITY_PRIMARY_FILTERS,
  type OpportunityPrimaryFilter,
  type OpportunityStartWindow,
} from "@/lib/opportunityStartDate";
import type { OpportunitiesListStatusFilter } from "@/lib/opportunitiesList";

export function OpportunitiesStartWindow({
  listStatusFilter,
  startWindow,
  onPrimaryFilterChange,
  usingLegacyStatusFilter,
}: {
  listStatusFilter: OpportunitiesListStatusFilter;
  startWindow: OpportunityStartWindow;
  onPrimaryFilterChange: (filter: OpportunityPrimaryFilter) => void;
  usingLegacyStatusFilter?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Opportunity view">
      <span className="mr-1 text-[11px] font-medium text-slate-500">View</span>
      {OPPORTUNITY_PRIMARY_FILTERS.map((filter) => {
        const active =
          !usingLegacyStatusFilter &&
          (filter === "won" || filter === "lost"
            ? listStatusFilter === filter
            : filter === "all"
              ? listStatusFilter === "all" && startWindow === "all"
              : listStatusFilter === "active" && startWindow === filter);
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={active}
            onClick={() => onPrimaryFilterChange(filter)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              active
                ? "bg-violet-700 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {OPPORTUNITY_PRIMARY_FILTER_LABELS[filter]}
          </button>
        );
      })}
    </div>
  );
}
