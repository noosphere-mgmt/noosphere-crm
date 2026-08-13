"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CoverageMultiSelect } from "@/components/admin/connections/CoverageMultiSelect";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import {
  EMPTY_CONNECTIONS_QUICK_FILTERS,
  parseConnectionsRoleFilter,
  type ConnectionsQuickFilters,
} from "@/lib/connectionsList";

const searchClass = `w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 ${connectionsGlassClasses.inputFocus}`;
const selectClass = `min-w-[8.5rem] rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-800 ${connectionsGlassClasses.inputFocus}`;
const resetButtonClass =
  "shrink-0 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-default disabled:opacity-40";

export function ConnectionsSearchToolbarDesktop({
  searchQuery,
  onSearchChange,
  quickFilters,
  onQuickFiltersChange,
  countries,
  cities,
  variant = "contacts",
  relationshipTypeSlot,
  hideSearch = false,
  onAfterReset,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  quickFilters: ConnectionsQuickFilters;
  onQuickFiltersChange: (next: ConnectionsQuickFilters) => void;
  countries: string[];
  cities: string[];
  variant?: "companies" | "contacts";
  relationshipTypeSlot?: React.ReactNode;
  /** When true, omit the search input (e.g. companies split has column-local search). */
  hideSearch?: boolean;
  /** Extra reset work (e.g. clear company-column search). */
  onAfterReset?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCompanies = variant === "companies";
  const searchPlaceholder = isCompanies
    ? "Search companies & contacts — names, notes, email, phone, WhatsApp…"
    : "Search company, contact, country, city, coverage, role…";
  const activeRole = isCompanies ? parseConnectionsRoleFilter(searchParams.get("role")) : null;

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    Boolean(quickFilters.country.trim()) ||
    Boolean(quickFilters.city.trim()) ||
    quickFilters.coverage.length > 0 ||
    activeRole != null;

  function resetAll() {
    onSearchChange("");
    onQuickFiltersChange(EMPTY_CONNECTIONS_QUICK_FILTERS);
    if (activeRole != null) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("role");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
    onAfterReset?.();
  }

  // Layout mirrors PremisesFiltersBarDesktop: search row, then compact filter row.
  return (
    <div className="mb-3 rounded-lg border border-slate-200 bg-white text-sm">
      {hideSearch ? null : (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <div className="min-w-0 flex-1">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={isCompanies ? "Search companies and contacts" : "Search connections"}
              className={searchClass}
            />
          </div>
          <button
            type="button"
            onClick={resetAll}
            disabled={!hasActiveFilters}
            className={resetButtonClass}
          >
            Reset all
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {isCompanies && relationshipTypeSlot ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">{relationshipTypeSlot}</div>
        ) : null}

        <CoverageMultiSelect
          value={quickFilters.coverage}
          onChange={(coverage) => onQuickFiltersChange({ ...quickFilters, coverage })}
        />

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

        {hideSearch ? (
          <button
            type="button"
            onClick={resetAll}
            disabled={!hasActiveFilters}
            className={resetButtonClass}
          >
            Reset all
          </button>
        ) : null}
      </div>
    </div>
  );
}
