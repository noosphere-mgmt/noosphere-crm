"use client";

import { OpportunitiesSalesCopilot } from "@/components/admin/opportunities/OpportunitiesSalesCopilot";
import { OpportunitiesStartWindow } from "@/components/admin/opportunities/OpportunitiesStartWindow";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListStatusFilter } from "@/lib/opportunitiesList";
import type { OpportunityPrimaryFilter, OpportunityStartWindow } from "@/lib/opportunityStartDate";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunitiesSearchToolbarMobile({
  searchQuery,
  onSearchChange,
  listStatusFilter,
  startWindow,
  onPrimaryFilterChange,
  usingLegacyStatusFilter,
  rows,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  listStatusFilter: OpportunitiesListStatusFilter;
  startWindow: OpportunityStartWindow;
  onPrimaryFilterChange: (filter: OpportunityPrimaryFilter) => void;
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
      <OpportunitiesStartWindow
        listStatusFilter={listStatusFilter}
        startWindow={startWindow}
        onPrimaryFilterChange={onPrimaryFilterChange}
        usingLegacyStatusFilter={usingLegacyStatusFilter}
      />
    </div>
  );
}
