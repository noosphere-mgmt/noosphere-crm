"use client";

import {
  OPPORTUNITIES_LIST_STATUS_FILTER_LABELS,
  OPPORTUNITIES_VIEW_SCOPE_FILTERS,
  opportunitiesViewScopeFromFilter,
  type OpportunitiesListStatusFilter,
} from "@/lib/opportunitiesList";

export function OpportunitiesViewScope({
  listStatusFilter,
  onListStatusFilterChange,
  usingLegacyStatusFilter,
}: {
  listStatusFilter: OpportunitiesListStatusFilter;
  onListStatusFilterChange: (filter: OpportunitiesListStatusFilter) => void;
  usingLegacyStatusFilter?: boolean;
}) {
  const scope = usingLegacyStatusFilter ? null : opportunitiesViewScopeFromFilter(listStatusFilter);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-[11px] font-medium text-slate-500">View</span>
      {OPPORTUNITIES_VIEW_SCOPE_FILTERS.map((filter) => {
        const active = scope === filter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onListStatusFilterChange(filter)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              active
                ? "bg-slate-800 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {OPPORTUNITIES_LIST_STATUS_FILTER_LABELS[filter]}
          </button>
        );
      })}
    </div>
  );
}
