"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { OpportunitiesSearchToolbar } from "@/components/admin/opportunities/OpportunitiesSearchToolbar";
import { useOpportunitiesListSelection } from "@/components/admin/opportunities/OpportunitiesListSelectionContext";
import { OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import {
  EMPTY_OPPORTUNITIES_QUICK_FILTERS,
  formatOpportunityAreaCapacity,
  formatOpportunityBudget,
  opportunityMatchesGlobalSearch,
  opportunityMatchesQuickFilters,
  opportunityMatchesDashboardStage,
  isOpportunityStatus,
  type OpportunitiesDashboardStage,
  type OpportunitiesQuickFilters,
} from "@/lib/opportunitiesList";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import type { Opportunity } from "@/lib/types/entities";
import { MobileCard, MobileCardList, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";

type SortKey = "opportunity" | "company" | "contact" | "lead" | "requirement" | "budget" | "status" | "updated";
type SortDir = "asc" | "desc";

function compareText(a: string, b: string, dir: SortDir): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={`px-3 py-1.5 align-top font-medium ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-left hover:text-slate-900"
      >
        <span>{label}</span>
        {active ? <span className="text-slate-500">{sortDir === "asc" ? "↑" : "↓"}</span> : null}
      </button>
    </th>
  );
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

export function OpportunitiesListClient({
  rows,
  onQuickView,
  initialStatus,
  initialStage,
}: {
  rows: Opportunity[];
  onQuickView: (id: number) => void;
  initialStatus?: string;
  initialStage?: OpportunitiesDashboardStage;
}) {
  const { selected, toggleOne, toggleAll, selectedCount } = useOpportunitiesListSelection();
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState<OpportunitiesQuickFilters>({
    ...EMPTY_OPPORTUNITIES_QUICK_FILTERS,
    status: initialStatus && isOpportunityStatus(initialStatus) ? initialStatus : "",
  });
  const [dashboardStage] = useState(initialStage);
  const theme = moduleAccentClasses("opportunities");

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

  return (
    <>
      <OpportunitiesSearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        quickFilters={quickFilters}
        onQuickFiltersChange={setQuickFilters}
      />
      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={rows.length}
        label="Opportunities"
        selectedCount={selectedCount}
      />
      <MobileCardList>
        {displayedRows.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No opportunities yet." : "No opportunities match your search."}
          </p>
        ) : (
          displayedRows.map((row) => (
            <MobileCard key={row.id} onClick={() => onQuickView(row.id)}>
              <div className="flex items-start justify-between gap-2">
                <MobileCardTitle>{row.client_name}</MobileCardTitle>
                <span {...opportunityStatusChip(row.status)} className="shrink-0 text-xs">
                  {OPPORTUNITY_STATUS_LABELS[row.status]}
                </span>
              </div>
              <MobileCardMeta>
                {row.linked_company_name ?? "No company"}
                {row.district_preference ? ` · ${row.district_preference.split(/[,;/|]/)[0]?.trim()}` : ""}
              </MobileCardMeta>
              <MobileCardMeta>
                {formatOpportunityBudget(row.budget_max, row.budget_min)} · Updated{" "}
                {formatDateLabel(row.updated_at)}
              </MobileCardMeta>
            </MobileCard>
          ))
        )}
      </MobileCardList>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-10 px-3 py-1.5 align-top">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allDisplayedSelected}
                  onChange={(e) => toggleAll(displayedIds, e.target.checked)}
                  className="rounded border-slate-300"
                />
              </th>
              <SortableHeader label="Opportunity" sortKey="opportunity" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Contact" sortKey="contact" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Lead Type" sortKey="lead" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Requirement" sortKey="requirement" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Budget (HKD)" sortKey="budget" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="w-24 px-3 py-1.5 align-top font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  No opportunities yet.
                </td>
              </tr>
            ) : displayedRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  No opportunities match your search.
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.client_name}`}
                      checked={selected.has(String(row.id))}
                      onChange={() => toggleOne(String(row.id))}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Link
                      href={`/admin/opportunities/${row.id}`}
                      className={`text-left ${theme.link}`}
                    >
                      {row.client_name}
                      {row.district_preference ? ` – ${row.district_preference.split(/[,;/|]/)[0]?.trim()}` : ""}
                    </Link>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{row.linked_company_name ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{row.primary_contact_name ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{OPPORTUNITY_LEAD_TYPE_LABELS[row.lead_type]}</td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {formatOpportunityAreaCapacity(row.required_area_sqft, row.required_capacity_pax)}
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {formatOpportunityBudget(row.budget_max, row.budget_min)}
                  </td>
                  <td className="px-3 py-1.5">
                    <span {...opportunityStatusChip(row.status)}>{OPPORTUNITY_STATUS_LABELS[row.status]}</span>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{formatDateLabel(row.updated_at)}</td>
                  <td className="px-3 py-1.5">
                    <ModuleRowActions
                      module="opportunities"
                      onView={() => onQuickView(row.id)}
                      editHref={`/admin/opportunities/${row.id}?mode=edit`}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
