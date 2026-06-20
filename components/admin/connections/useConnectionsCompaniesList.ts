"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";
import {
  formatCompanyRoles,
  formatCoverage,
  type ConnectionCompanyListRow,
} from "@/lib/connectionsDisplay";
import {
  companyMatchesGlobalSearch,
  companyMatchesRole,
  EMPTY_CONNECTIONS_QUICK_FILTERS,
  matchesQuickFilters,
} from "@/lib/connectionsList";
import type { CompanyRole } from "@/lib/types/entities";

type SortKey = "company" | "contact" | "role" | "coverage" | "opportunities" | "updated";
type SortDir = "asc" | "desc";

function compareText(a: string, b: string, dir: SortDir): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

function compareNum(a: number, b: number, dir: SortDir): number {
  return dir === "asc" ? a - b : b - a;
}

export function useConnectionsCompaniesList(rows: ConnectionCompanyListRow[]) {
  const searchParams = useSearchParams();
  const roleFilter = (searchParams.get("role") as CompanyRole | null) || null;
  const { selected, toggleOne, toggleAll, selectedCount } = useConnectionsListSelection();

  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState(EMPTY_CONNECTIONS_QUICK_FILTERS);

  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.country).filter(Boolean))].sort() as string[],
    [rows],
  );
  const cities = useMemo(
    () => [...new Set(rows.map((r) => r.city).filter(Boolean))].sort() as string[],
    [rows],
  );

  const displayedRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (!companyMatchesRole(row.roles, roleFilter)) return false;
      if (!matchesQuickFilters(row, quickFilters)) return false;
      if (!companyMatchesGlobalSearch(row, searchQuery)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "company":
          return compareText(a.company_name, b.company_name, sortDir);
        case "contact":
          return compareText(a.primary_contact_name ?? "", b.primary_contact_name ?? "", sortDir);
        case "role":
          return compareText(formatCompanyRoles(a.roles), formatCompanyRoles(b.roles), sortDir);
        case "coverage":
          return compareText(formatCoverage(a.coverage), formatCoverage(b.coverage), sortDir);
        case "opportunities":
          return compareNum(a.open_opportunities ?? 0, b.open_opportunities ?? 0, sortDir);
        case "updated":
          return compareText(a.updated_at ?? "", b.updated_at ?? "", sortDir);
        default:
          return 0;
      }
    });
  }, [rows, quickFilters, roleFilter, searchQuery, sortKey, sortDir]);

  const displayedIds = useMemo(() => displayedRows.map((r) => String(r.id)), [displayedRows]);
  useSyncListingExportIds(displayedIds);
  const allDisplayedSelected =
    displayedIds.length > 0 && displayedIds.every((id) => selected.has(id));

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "updated" ? "desc" : "asc");
    }
  }

  return {
    rows,
    searchParams,
    selected,
    toggleOne,
    toggleAll,
    selectedCount,
    sortKey,
    sortDir,
    searchQuery,
    setSearchQuery,
    quickFilters,
    setQuickFilters,
    countries,
    cities,
    displayedRows,
    displayedIds,
    allDisplayedSelected,
    handleSort,
  };
}

export type ConnectionsCompaniesListState = ReturnType<typeof useConnectionsCompaniesList>;
