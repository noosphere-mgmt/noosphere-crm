"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { formatCoverage } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import {
  contactMatchesGlobalSearch,
  contactMatchesQuickFilters,
  EMPTY_CONNECTIONS_QUICK_FILTERS,
} from "@/lib/connectionsList";
import type { Contact } from "@/lib/types/entities";

type SortKey = "name" | "company" | "coverage" | "updated";
type SortDir = "asc" | "desc";

function compareText(a: string, b: string, dir: SortDir): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

export function useConnectionsContactsList(rows: Contact[]) {
  const searchParams = useSearchParams();
  const { selected, toggleOne, toggleAll, selectedCount } = useConnectionsListSelection();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState(EMPTY_CONNECTIONS_QUICK_FILTERS);

  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.company_country).filter(Boolean))].sort() as string[],
    [rows],
  );
  const cities = useMemo(
    () => [...new Set(rows.map((r) => r.company_city).filter(Boolean))].sort() as string[],
    [rows],
  );

  const displayedRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (!contactMatchesQuickFilters(row, quickFilters)) return false;
      if (!contactMatchesGlobalSearch(row, searchQuery)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return compareText(getContactLabel(a), getContactLabel(b), sortDir);
        case "company":
          return compareText(a.company_name ?? "", b.company_name ?? "", sortDir);
        case "coverage":
          return compareText(formatCoverage(a.coverage), formatCoverage(b.coverage), sortDir);
        case "updated":
          return compareText(a.updated_at ?? "", b.updated_at ?? "", sortDir);
        default:
          return 0;
      }
    });
  }, [rows, quickFilters, searchQuery, sortKey, sortDir]);

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

export type ConnectionsContactsListState = ReturnType<typeof useConnectionsContactsList>;
