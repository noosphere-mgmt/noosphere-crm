"use client";

import { useMemo, useState } from "react";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { useOpportunitiesListSelection } from "@/components/admin/opportunities/OpportunitiesListSelectionContext";
import { OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import {
  EMPTY_OPPORTUNITIES_QUICK_FILTERS,
  formatOpportunityAreaCapacity,
  formatOpportunityBudget,
  isOpportunityStatus,
  opportunityMatchesDashboardStage,
  opportunityMatchesGlobalSearch,
  opportunityMatchesQuickFilters,
  type OpportunitiesDashboardStage,
  type OpportunitiesQuickFilters,
} from "@/lib/opportunitiesList";
import type { Opportunity } from "@/lib/types/entities";

type SortKey = "opportunity" | "company" | "contact" | "lead" | "requirement" | "budget" | "status" | "updated";
type SortDir = "asc" | "desc";

function compareText(a: string, b: string, dir: SortDir): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

export function useOpportunitiesList(
  rows: Opportunity[],
  initialStatus?: string,
  initialStage?: OpportunitiesDashboardStage,
) {
  const { selected, toggleOne, toggleAll, selectedCount } = useOpportunitiesListSelection();
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState<OpportunitiesQuickFilters>({
    ...EMPTY_OPPORTUNITIES_QUICK_FILTERS,
    status: initialStatus && isOpportunityStatus(initialStatus) ? initialStatus : "",
  });
  const [dashboardStage] = useState(initialStage);

  const displayedRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (dashboardStage && !opportunityMatchesDashboardStage(row, dashboardStage)) return false;
      if (!opportunityMatchesQuickFilters(row, quickFilters)) return false;
      if (!opportunityMatchesGlobalSearch(row, searchQuery)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "opportunity":
          return compareText(a.client_name, b.client_name, sortDir);
        case "company":
          return compareText(a.linked_company_name ?? "", b.linked_company_name ?? "", sortDir);
        case "contact":
          return compareText(a.primary_contact_name ?? "", b.primary_contact_name ?? "", sortDir);
        case "lead":
          return compareText(OPPORTUNITY_LEAD_TYPE_LABELS[a.lead_type], OPPORTUNITY_LEAD_TYPE_LABELS[b.lead_type], sortDir);
        case "requirement":
          return compareText(
            formatOpportunityAreaCapacity(a.required_area_sqft, a.required_capacity_pax),
            formatOpportunityAreaCapacity(b.required_area_sqft, b.required_capacity_pax),
            sortDir,
          );
        case "budget": {
          const budgetNum = (row: Opportunity) => {
            const raw = row.budget_max?.trim() || row.budget_min?.trim() || "";
            const n = Number.parseFloat(raw.replace(/,/g, ""));
            return Number.isFinite(n) ? n : 0;
          };
          const cmp = budgetNum(a) - budgetNum(b);
          return sortDir === "asc" ? cmp : -cmp;
        }
        case "status":
          return compareText(
            OPPORTUNITY_STATUS_LABELS[a.status],
            OPPORTUNITY_STATUS_LABELS[b.status],
            sortDir,
          );
        case "updated":
          return compareText(a.updated_at ?? "", b.updated_at ?? "", sortDir);
        default:
          return 0;
      }
    });
  }, [rows, quickFilters, searchQuery, sortKey, sortDir, dashboardStage]);

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
    displayedRows,
    displayedIds,
    allDisplayedSelected,
    handleSort,
  };
}

export type OpportunitiesListState = ReturnType<typeof useOpportunitiesList>;
