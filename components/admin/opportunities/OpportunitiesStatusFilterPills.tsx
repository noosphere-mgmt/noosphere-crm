"use client";

import {
  OPPORTUNITIES_LIST_STATUS_FILTERS,
  OPPORTUNITIES_LIST_STATUS_FILTER_LABELS,
  type OpportunitiesListStatusFilter,
} from "@/lib/opportunitiesList";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function OpportunitiesStatusFilterPills({
  listStatusFilter,
  onListStatusFilterChange,
  counts,
  usingLegacyStatusFilter,
}: {
  listStatusFilter: OpportunitiesListStatusFilter;
  onListStatusFilterChange: (filter: OpportunitiesListStatusFilter) => void;
  counts: Record<OpportunitiesListStatusFilter, number>;
  usingLegacyStatusFilter?: boolean;
}) {
  const theme = moduleAccentClasses("opportunities");

  return (
    <div className="flex flex-wrap gap-1.5">
      {OPPORTUNITIES_LIST_STATUS_FILTERS.map((filter) => {
        const active = !usingLegacyStatusFilter && listStatusFilter === filter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onListStatusFilterChange(filter)}
            className={active ? theme.filterPillActive : theme.filterPillInactive}
          >
            {OPPORTUNITIES_LIST_STATUS_FILTER_LABELS[filter]} ({counts[filter]})
          </button>
        );
      })}
    </div>
  );
}
