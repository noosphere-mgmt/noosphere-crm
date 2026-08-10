"use client";

import Link from "next/link";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import type { Opportunity } from "@/lib/types/entities";

function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 10);
}

const STATUS_CHANCE: Record<Opportunity["status"], { percent: number; label: string }> = {
  qualifying: { percent: 20, label: "Low" },
  sourcing: { percent: 30, label: "Low" },
  proposal_reviewing: { percent: 50, label: "Medium" },
  negotiating: { percent: 70, label: "High" },
  closed_won: { percent: 100, label: "Won" },
  closed_lost: { percent: 0, label: "Lost" },
};

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
  onOpenWorkspace,
}: {
  state: OpportunitiesListState;
  onOpenWorkspace: (row: Opportunity) => void;
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
  const colCount = 8;

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
            <SortableHeader label="Expected close · chance" sortKey="expected_close" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="w-24 px-3 py-1.5 align-top font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-slate-500">
                No opportunities yet.
              </td>
            </tr>
          ) : displayedRows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-slate-500">
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
                <td className="max-w-[14rem] px-3 py-1.5">
                  <Link
                    href={opportunityWorkspaceHref(row, "overview")}
                    className={`block truncate text-left ${theme.link}`}
                    title={row.client_name}
                  >
                    {row.client_name}
                    {row.district_preference ? ` – ${row.district_preference.split(/[,;/|]/)[0]?.trim()}` : ""}
                  </Link>
                  <RecordBusinessId id={row.business_id ?? row.v1_opportunity_id} className="mt-0.5 block" />
                </td>
                <td className="px-3 py-1.5 text-slate-700">{row.linked_company_name ?? "—"}</td>
                <td className="px-3 py-1.5 text-slate-700">{row.primary_contact_name ?? "—"}</td>
                <td className="px-3 py-1.5 text-slate-700">
                  <p className="tabular-nums">{formatDateLabel(row.expected_close_date)}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {STATUS_CHANCE[row.status].label} · {STATUS_CHANCE[row.status].percent}%
                  </p>
                </td>
                <td className="px-3 py-1.5">
                  <span {...opportunityStatusChip(row.status)}>{OPPORTUNITY_STATUS_LABELS[row.status]}</span>
                </td>
                <td className="px-3 py-1.5 text-slate-700">{formatDateLabel(row.updated_at)}</td>
                <td className="px-3 py-1.5">
                  <ModuleRowActions
                    module="opportunities"
                    onView={() => onOpenWorkspace(row)}
                    editHref={opportunityWorkspaceHref(row, "overview", "edit")}
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
