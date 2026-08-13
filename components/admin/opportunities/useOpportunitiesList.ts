"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { useOpportunitiesListSelection } from "@/components/admin/opportunities/OpportunitiesListSelectionContext";
import { compareSortText, nextSortState, type SortDir } from "@/components/admin/SortableTableHeader";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import {
  countOpportunitiesListStatusFilter,
  EMPTY_OPPORTUNITIES_QUICK_FILTERS,
  opportunityMatchesDashboardStage,
  opportunityMatchesGlobalSearch,
  opportunityMatchesListStatusFilter,
  opportunityMatchesQuickFilters,
  type OpportunitiesDashboardStage,
  type OpportunitiesListStatusFilter,
  type OpportunitiesQuickFilters,
} from "@/lib/opportunitiesList";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

type SortKey = "opportunity" | "company" | "contact" | "expected_close" | "status" | "updated";

export function useOpportunitiesList(
  rows: Opportunity[],
  initialListStatusFilter: OpportunitiesListStatusFilter = "active",
  initialLegacyStatuses: OpportunityStatus[] = [],
  initialDashboardStage?: OpportunitiesDashboardStage,
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selected, toggleOne, toggleAll, selectedCount } = useOpportunitiesListSelection();
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [listStatusFilter, setListStatusFilterState] = useState(initialListStatusFilter);
  const [dashboardStage, setDashboardStageState] = useState(initialDashboardStage);
  const [quickFilters, setQuickFiltersState] = useState<OpportunitiesQuickFilters>({
    ...EMPTY_OPPORTUNITIES_QUICK_FILTERS,
    statuses: initialLegacyStatuses,
  });

  const statusFilterCounts = useMemo(
    () => ({
      active: countOpportunitiesListStatusFilter(rows, "active"),
      all: countOpportunitiesListStatusFilter(rows, "all"),
      won: countOpportunitiesListStatusFilter(rows, "won"),
      lost: countOpportunitiesListStatusFilter(rows, "lost"),
      closed: countOpportunitiesListStatusFilter(rows, "closed"),
    }),
    [rows],
  );

  const syncListParams = useCallback(
    (next: {
      listStatusFilter?: OpportunitiesListStatusFilter;
      dashboardStage?: OpportunitiesDashboardStage | undefined;
      legacyStatuses?: OpportunityStatus[];
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("opportunity");
      params.delete("tab");
      params.delete("mode");
      params.delete("new");
      params.delete("company_id");

      const filter = next.listStatusFilter ?? listStatusFilter;
      const stage = next.dashboardStage !== undefined ? next.dashboardStage : dashboardStage;
      const legacy = next.legacyStatuses ?? quickFilters.statuses;

      if (legacy.length > 0) {
        params.set("status", legacy.join(","));
        params.delete("stage");
      } else {
        params.set("status", filter);
        if (stage) params.set("stage", stage);
        else params.delete("stage");
      }

      const qs = params.toString();
      router.replace(qs ? `/admin/opportunities?${qs}` : "/admin/opportunities");
    },
    [dashboardStage, listStatusFilter, quickFilters.statuses, router, searchParams],
  );

  const setListStatusFilter = useCallback(
    (filter: OpportunitiesListStatusFilter) => {
      setListStatusFilterState(filter);
      setDashboardStageState(undefined);
      setQuickFiltersState(EMPTY_OPPORTUNITIES_QUICK_FILTERS);
      syncListParams({ listStatusFilter: filter, dashboardStage: undefined, legacyStatuses: [] });
    },
    [syncListParams],
  );

  const setQuickFilters = useCallback(
    (next: OpportunitiesQuickFilters) => {
      setQuickFiltersState(next);
      if (next.statuses.length > 0) {
        setDashboardStageState(undefined);
        syncListParams({ legacyStatuses: next.statuses, dashboardStage: undefined });
      }
    },
    [syncListParams],
  );

  const displayedRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (quickFilters.statuses.length > 0) {
        if (!opportunityMatchesQuickFilters(row, quickFilters)) return false;
      } else {
        if (dashboardStage && !opportunityMatchesDashboardStage(row, dashboardStage)) return false;
        if (!opportunityMatchesListStatusFilter(row, listStatusFilter)) return false;
      }
      if (!opportunityMatchesGlobalSearch(row, searchQuery)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "opportunity":
          return compareSortText(a.client_name, b.client_name, sortDir);
        case "company":
          return compareSortText(a.linked_company_name, b.linked_company_name, sortDir);
        case "contact":
          return compareSortText(a.primary_contact_name, b.primary_contact_name, sortDir);
        case "expected_close":
          return compareSortText(a.expected_close_date, b.expected_close_date, sortDir);
        case "status":
          return compareSortText(
            OPPORTUNITY_STATUS_LABELS[a.status] ?? a.status,
            OPPORTUNITY_STATUS_LABELS[b.status] ?? b.status,
            sortDir,
          );
        case "updated":
          return compareSortText(a.updated_at, b.updated_at, sortDir);
        default:
          return 0;
      }
    });
  }, [rows, quickFilters, searchQuery, sortKey, sortDir, dashboardStage, listStatusFilter]);

  const displayedIds = useMemo(() => displayedRows.map((r) => String(r.id)), [displayedRows]);
  useSyncListingExportIds(displayedIds);
  const allDisplayedSelected =
    displayedIds.length > 0 && displayedIds.every((id) => selected.has(id));

  const handleSort = useCallback((key: SortKey) => {
    const next = nextSortState(sortKey, sortDir, key, (k) => (k === "updated" ? "desc" : "asc"));
    setSortKey(next.sortKey);
    setSortDir(next.sortDir);
  }, [sortDir, sortKey]);

  const usingLegacyStatusFilter = quickFilters.statuses.length > 0;

  return {
    rows,
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
    listStatusFilter,
    setListStatusFilter,
    statusFilterCounts,
    dashboardStage,
    usingLegacyStatusFilter,
    displayedRows,
    displayedIds,
    allDisplayedSelected,
    handleSort,
  };
}

export type OpportunitiesListState = ReturnType<typeof useOpportunitiesList>;
