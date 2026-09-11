"use client";

import { OpportunitiesSalesCopilot } from "@/components/admin/opportunities/OpportunitiesSalesCopilot";
import { OpportunitiesViewScope } from "@/components/admin/opportunities/OpportunitiesViewScope";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListStatusFilter } from "@/lib/opportunitiesList";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunitiesSearchToolbarMobile({
  searchQuery,
  onSearchChange,
  listStatusFilter,
  onListStatusFilterChange,
  usingLegacyStatusFilter,
  rows,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listStatusFilter: OpportunitiesListStatusFilter;
  onListStatusFilterChange: (filter: OpportunitiesListStatusFilter) => void;
  usingLegacyStatusFilter?: boolean;
  rows: Opportunity[];
}) {
  const theme = moduleAccentClasses("opportunities");

  return (
    <div className="mb-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="w-1/3 min-w-0 shrink-0">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search client, company, contact, district…"
            aria-label="Search opportunities"
            className={`${theme.searchInput} py-1.5`}
          />
        </div>
        <OpportunitiesSalesCopilot rows={rows} />
      </div>
      <OpportunitiesViewScope
        listStatusFilter={listStatusFilter}
        onListStatusFilterChange={onListStatusFilterChange}
        usingLegacyStatusFilter={usingLegacyStatusFilter}
      />
    </div>
  );
}
