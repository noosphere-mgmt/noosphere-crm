"use client";

import { COVERAGE_OPTIONS } from "@/lib/connectionsValues";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { ConnectionsQuickFilters } from "@/lib/connectionsList";

const searchClass = `w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 ${connectionsGlassClasses.inputFocus}`;
const selectClass = `min-w-[8.5rem] rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-800 ${connectionsGlassClasses.inputFocus}`;

export function ConnectionsSearchToolbar({
  searchQuery,
  onSearchChange,
  quickFilters,
  onQuickFiltersChange,
  countries,
  cities,
  showRelationshipType,
  relationshipTypeSlot,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  quickFilters: ConnectionsQuickFilters;
  onQuickFiltersChange: (next: ConnectionsQuickFilters) => void;
  countries: string[];
  cities: string[];
  showRelationshipType?: boolean;
  relationshipTypeSlot?: React.ReactNode;
}) {
  return (
    <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search company, contact, country, city, coverage…"
        aria-label="Search connections"
        className={searchClass}
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {showRelationshipType && relationshipTypeSlot ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">{relationshipTypeSlot}</div>
        ) : null}

        <select
          aria-label="Filter by coverage"
          value={quickFilters.coverage}
          onChange={(e) => onQuickFiltersChange({ ...quickFilters, coverage: e.target.value })}
          className={selectClass}
        >
          <option value="">Coverage</option>
          {COVERAGE_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by country"
          value={quickFilters.country}
          onChange={(e) => onQuickFiltersChange({ ...quickFilters, country: e.target.value })}
          className={selectClass}
        >
          <option value="">Country</option>
          {countries.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by city"
          value={quickFilters.city}
          onChange={(e) => onQuickFiltersChange({ ...quickFilters, city: e.target.value })}
          className={selectClass}
        >
          <option value="">City</option>
          {cities.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
