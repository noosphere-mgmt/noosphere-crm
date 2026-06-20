"use client";

import Link from "next/link";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import {
  formatOpportunityAreaCapacity,
  formatOpportunityBudget,
} from "@/lib/opportunitiesList";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
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
  sortKey: OpportunitiesListState["sortKey"];
  activeKey: OpportunitiesListState["sortKey"];
  sortDir: OpportunitiesListState["sortDir"];
  onSort: (key: OpportunitiesListState["sortKey"]) => void;
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

export function OpportunitiesListDesktop({
  state,
  onQuickView,
}: {
  state: OpportunitiesListState;
  onQuickView: (id: number) => void;
}) {
  const {
    rows,
    selected,
    toggleOne,
    toggleAll,
    sortKey,
    sortDir,
    displayedRows,
    displayedIds,
    allDisplayedSelected,
    handleSort,
  } = state;
  const theme = moduleAccentClasses("opportunities");

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
                  <Link href={`/admin/opportunities/${row.id}`} className={`text-left ${theme.link}`}>
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
  );
}
