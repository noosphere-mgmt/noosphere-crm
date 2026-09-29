"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { useOpportunitiesListSelection } from "@/components/admin/opportunities/OpportunitiesListSelectionContext";
import { compareSortText, nextSortState, type SortDir } from "@/components/admin/SortableTableHeader";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { parseOpportunityMoney } from "@/lib/opportunityFinancials";
import {
  countOpportunitiesListStatusFilter,
  EMPTY_OPPORTUNITIES_QUICK_FILTERS,
  opportunityMatchesDashboardStage,
  opportunityMatchesGlobalSearch,
  opportunityMatchesListQuickFilter,
  opportunityMatchesListStatusFilter,
  opportunityMatchesQuickFilters,
  statusFilterForKpi,
  type OpportunitiesDashboardStage,
  type OpportunitiesKpiFilter,
  type OpportunitiesListStatusFilter,
  type OpportunitiesQuickFilters,
} from "@/lib/opportunitiesList";
import {
  parseOpportunityStartWindow,
  type OpportunityPrimaryFilter,
  type OpportunityStartWindow,
} from "@/lib/opportunityStartDate";
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
  const [kpiFilter, setKpiFilterState] = useState<OpportunitiesKpiFilter | null>(
    searchParams.get("kpi") === "payouts" ? "won_payouts" : null,
  );
  const [dashboardStage, setDashboardStageState] = useState(initialDashboardStage);
  const [quickFilters, setQuickFiltersState] = useState<OpportunitiesQuickFilters>({
    ...EMPTY_OPPORTUNITIES_QUICK_FILTERS,
    statuses: initialLegacyStatuses,
  });
  const [startWindow, setStartWindowState] = useState<OpportunityStartWindow>(() => {
    const horizon = searchParams.get("horizon");
    if (horizon) return parseOpportunityStartWindow(horizon);
    return initialListStatusFilter === "won" ||
      initialListStatusFilter === "lost" ||
      initialListStatusFilter === "closed" ||
      initialListStatusFilter === "all"
      ? "all"
      : "active";
  });

  const rowsInStartWindow = useMemo(
    () => rows.filter((row) => opportunityMatchesListQuickFilter(row, startWindow)),
    [rows, startWindow],
  );

  const statusFilterCounts = useMemo(
    () => ({
      all: countOpportunitiesListStatusFilter(rowsInStartWindow, "all"),
      active: countOpportunitiesListStatusFilter(rowsInStartWindow, "active"),
      qualifying: countOpportunitiesListStatusFilter(rowsInStartWindow, "qualifying"),
      sourcing: countOpportunitiesListStatusFilter(rowsInStartWindow, "sourcing"),
      proposal_reviewing: countOpportunitiesListStatusFilter(rowsInStartWindow, "proposal_reviewing"),
      negotiating: countOpportunitiesListStatusFilter(rowsInStartWindow, "negotiating"),
      won: countOpportunitiesListStatusFilter(rows, "won"),
      lost: countOpportunitiesListStatusFilter(rows, "lost"),
      closed: countOpportunitiesListStatusFilter(rows, "closed"),
    }),
    [rows, rowsInStartWindow],
  );

  const syncListParams = useCallback(
    (next: {
      listStatusFilter?: OpportunitiesListStatusFilter;
      dashboardStage?: OpportunitiesDashboardStage | undefined;
      legacyStatuses?: OpportunityStatus[];
      kpiFilter?: OpportunitiesKpiFilter | null;
      startWindow?: OpportunityStartWindow;
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
      const kpi = next.kpiFilter !== undefined ? next.kpiFilter : kpiFilter;
      const horizon = next.startWindow ?? startWindow;

      if (horizon === "active") params.delete("horizon");
      else params.set("horizon", horizon);

      if (legacy.length > 0) {
        params.set("status", legacy.join(","));
        params.delete("stage");
        params.delete("kpi");
      } else {
        params.set("status", filter);
        if (stage) params.set("stage", stage);
        else params.delete("stage");
        if (kpi === "won_payouts") params.set("kpi", "payouts");
        else params.delete("kpi");
      }

      const qs = params.toString();
      router.replace(qs ? `/admin/opportunities?${qs}` : "/admin/opportunities");
    },
    [dashboardStage, kpiFilter, listStatusFilter, quickFilters.statuses, router, searchParams, startWindow],
  );

  const setPrimaryFilter = useCallback(
    (filter: OpportunityPrimaryFilter) => {
      const nextStartWindow: OpportunityStartWindow =
        filter === "won" || filter === "lost" || filter === "all" ? "all" : filter;
      const nextStatus: OpportunitiesListStatusFilter =
        filter === "won" || filter === "lost"
          ? filter
          : filter === "all"
            ? "all"
            : "active";

      setStartWindowState(nextStartWindow);
      setListStatusFilterState(nextStatus);
      setKpiFilterState(null);
      setDashboardStageState(undefined);
      setQuickFiltersState(EMPTY_OPPORTUNITIES_QUICK_FILTERS);
      syncListParams({
        listStatusFilter: nextStatus,
        startWindow: nextStartWindow,
        dashboardStage: undefined,
        legacyStatuses: [],
        kpiFilter: null,
      });
    },
    [syncListParams],
  );

  const setListStatusFilter = useCallback(
    (filter: OpportunitiesListStatusFilter) => {
      const nextStartWindow =
        filter === "won" || filter === "lost" || filter === "closed" || filter === "all"
          ? "all"
          : startWindow;
      setListStatusFilterState(filter);
      setStartWindowState(nextStartWindow);
      setKpiFilterState(null);
      setDashboardStageState(undefined);
      setQuickFiltersState(EMPTY_OPPORTUNITIES_QUICK_FILTERS);
      syncListParams({
        listStatusFilter: filter,
        startWindow: nextStartWindow,
        dashboardStage: undefined,
        legacyStatuses: [],
        kpiFilter: null,
      });
    },
    [startWindow, syncListParams],
  );

  const setKpiFilter = useCallback(
    (kpi: OpportunitiesKpiFilter) => {
      if (kpiFilter === kpi) {
        setKpiFilterState(null);
        setListStatusFilterState("all");
        setStartWindowState("all");
        setDashboardStageState(undefined);
        setQuickFiltersState(EMPTY_OPPORTUNITIES_QUICK_FILTERS);
        syncListParams({
          listStatusFilter: "all",
          startWindow: "all",
          dashboardStage: undefined,
          legacyStatuses: [],
          kpiFilter: null,
        });
        return;
      }
      const status = statusFilterForKpi(kpi);
      const nextStartWindow: OpportunityStartWindow =
        kpi === "pipeline_estimate" ? "active" : "all";
      setKpiFilterState(kpi);
      setListStatusFilterState(status);
      setStartWindowState(nextStartWindow);
      setDashboardStageState(undefined);
      setQuickFiltersState(EMPTY_OPPORTUNITIES_QUICK_FILTERS);
      syncListParams({
        listStatusFilter: status,
        startWindow: nextStartWindow,
        dashboardStage: undefined,
        legacyStatuses: [],
        kpiFilter: kpi,
      });
    },
    [kpiFilter, syncListParams],
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
        if (kpiFilter === "won_payouts" && parseOpportunityMoney(row.related_costs) == null) return false;
      }
      if (!opportunityMatchesListQuickFilter(row, startWindow)) return false;
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
  }, [rows, quickFilters, searchQuery, sortKey, sortDir, dashboardStage, listStatusFilter, kpiFilter, startWindow]);

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
    kpiFilter,
    setKpiFilter,
    statusFilterCounts,
    dashboardStage,
    startWindow,
    setPrimaryFilter,
    usingLegacyStatusFilter,
    displayedRows,
    displayedIds,
    allDisplayedSelected,
    handleSort,
  };
}

export type OpportunitiesListState = ReturnType<typeof useOpportunitiesList>;
