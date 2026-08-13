"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConnectionsRelationshipTypeFilters } from "@/components/admin/connections/ConnectionsRelationshipTypeFilters";
import { CoverageMultiSelect } from "@/components/admin/connections/CoverageMultiSelect";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import {
  EMPTY_CONNECTIONS_QUICK_FILTERS,
  parseConnectionsRoleFilter,
  type ConnectionsQuickFilters,
} from "@/lib/connectionsList";

const searchClass = `w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 ${connectionsGlassClasses.inputFocus}`;
const resetButtonClass =
  "shrink-0 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-default disabled:opacity-40";

export function ConnectionsSearchToolbarMobile({
  searchQuery,
  onSearchChange,
  quickFilters,
  onQuickFiltersChange,
  variant = "contacts",
  onAfterReset,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  quickFilters: ConnectionsQuickFilters;
  onQuickFiltersChange: (next: ConnectionsQuickFilters) => void;
  variant?: "companies" | "contacts";
  onAfterReset?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isCompanies = variant === "companies";
  const searchPlaceholder = isCompanies
    ? "Search companies & contacts — names, notes, email, phone…"
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

  if (isCompanies) {
    return (
      <div className="mb-2 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search companies and contacts"
            className={`${searchClass} min-w-0 flex-1 py-1.5`}
          />
          <button
            type="button"
            onClick={resetAll}
            disabled={!hasActiveFilters}
            className={resetButtonClass}
          >
            Reset all
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <ConnectionsRelationshipTypeFilters compact />
          <CoverageMultiSelect
            compact
            value={quickFilters.coverage}
            onChange={(coverage) => onQuickFiltersChange({ ...quickFilters, coverage })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search contacts"
          className={`${searchClass} min-w-0 flex-1 py-1.5`}
        />
        <button
          type="button"
          onClick={resetAll}
          disabled={!hasActiveFilters}
          className={resetButtonClass}
        >
          Reset all
        </button>
      </div>
    </div>
  );
}
