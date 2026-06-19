"use client";

import { OPPORTUNITY_LEAD_TYPES, OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUSES, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import type { OpportunitiesQuickFilters } from "@/lib/opportunitiesList";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function OpportunitiesSearchToolbar({
  searchQuery,
  onSearchChange,
  quickFilters,
  onQuickFiltersChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  quickFilters: OpportunitiesQuickFilters;
  onQuickFiltersChange: (next: OpportunitiesQuickFilters) => void;
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
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onQuickFiltersChange({ ...quickFilters, lead_type: "" })}
            className={quickFilters.lead_type ? theme.filterPillInactive : theme.filterPillActive}
          >
            All
          </button>
          {OPPORTUNITY_LEAD_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onQuickFiltersChange({ ...quickFilters, lead_type: t })}
              className={quickFilters.lead_type === t ? theme.filterPillActive : theme.filterPillInactive}
            >
              {OPPORTUNITY_LEAD_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <select
          aria-label="Filter by status"
          value={quickFilters.status}
          onChange={(e) => onQuickFiltersChange({ ...quickFilters, status: e.target.value })}
          className={theme.searchSelect}
        >
          <option value="">Status</option>
          {OPPORTUNITY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {OPPORTUNITY_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
