"use client";

import { ConnectionsRelationshipTypeFilters } from "@/components/admin/connections/ConnectionsRelationshipTypeFilters";
import { COVERAGE_OPTIONS } from "@/lib/connectionsValues";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { ConnectionsQuickFilters } from "@/lib/connectionsList";

const searchClass = `w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 ${connectionsGlassClasses.inputFocus}`;
const mobileSelectClass = `shrink-0 rounded-md border border-slate-200 px-2 py-1.5 text-xs text-slate-800 ${connectionsGlassClasses.inputFocus}`;

export function ConnectionsSearchToolbarMobile({
  searchQuery,
  onSearchChange,
  quickFilters,
  onQuickFiltersChange,
  variant = "contacts",
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  quickFilters: ConnectionsQuickFilters;
  onQuickFiltersChange: (next: ConnectionsQuickFilters) => void;
  variant?: "companies" | "contacts";
}) {
  const isCompanies = variant === "companies";
  const companiesSearchPlaceholder = "Search company, contact, country, city…";
  const contactsSearchPlaceholder = "Search company, contact, country, city, coverage, role…";

  if (isCompanies) {
    return (
      <div className="mb-2 space-y-1.5">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={companiesSearchPlaceholder}
          aria-label="Search companies"
          className={`${searchClass} py-1.5`}
        />
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <ConnectionsRelationshipTypeFilters compact />
          <select
            aria-label="Filter by coverage"
            value={quickFilters.coverage}
            onChange={(e) => onQuickFiltersChange({ ...quickFilters, coverage: e.target.value })}
            className={mobileSelectClass}
          >
            <option value="">Coverage</option>
            {COVERAGE_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={contactsSearchPlaceholder}
        aria-label="Search contacts"
        className={`${searchClass} py-1.5`}
      />
    </div>
  );
}
