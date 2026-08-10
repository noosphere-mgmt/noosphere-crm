"use client";

import { OpportunitiesStatusFilterPills } from "@/components/admin/opportunities/OpportunitiesStatusFilterPills";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListStatusFilter } from "@/lib/opportunitiesList";

export function OpportunitiesSearchToolbarMobile({
  searchQuery,
  onSearchChange,
  listStatusFilter,
  onListStatusFilterChange,
  statusFilterCounts,
  usingLegacyStatusFilter,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listStatusFilter: OpportunitiesListStatusFilter;
  onListStatusFilterChange: (filter: OpportunitiesListStatusFilter) => void;
  statusFilterCounts: Record<OpportunitiesListStatusFilter, number>;
  usingLegacyStatusFilter?: boolean;
}) {
  const theme = moduleAccentClasses("opportunities");

  return (
    <div className="mb-2 space-y-2">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search client, company, contact, district…"
        aria-label="Search opportunities"
        className={`${theme.searchInput} py-1.5`}
      />
      <div className="overflow-x-auto pb-0.5">
        <OpportunitiesStatusFilterPills
          listStatusFilter={listStatusFilter}
          onListStatusFilterChange={onListStatusFilterChange}
          counts={statusFilterCounts}
          usingLegacyStatusFilter={usingLegacyStatusFilter}
        />
      </div>
    </div>
  );
}
