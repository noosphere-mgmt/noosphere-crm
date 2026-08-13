"use client";

import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { SortableTableHeader } from "@/components/admin/SortableTableHeader";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { companyFullPageHref, contactFullPageHref } from "@/lib/crmDetailNav";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { buildOpportunitiesReturnTo } from "@/lib/opportunitiesDrawerNav";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import type { Opportunity } from "@/lib/types/entities";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const listReturnTo = buildOpportunitiesReturnTo(searchParams);
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
            <SortableTableHeader label="Opportunity" sortKey="opportunity" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Contact" sortKey="contact" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Expected Close · Chance" sortKey="expected_close" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Status" sortKey="status" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
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
                  <AdminEntityLink
                    href={opportunityWorkspaceHref(row, "overview", undefined, listReturnTo)}
                    className={`block truncate text-left ${theme.link}`}
                  >
                    <span title={row.client_name}>
                      {row.client_name}
                      {row.district_preference ? ` – ${row.district_preference.split(/[,;/|]/)[0]?.trim()}` : ""}
                    </span>
                  </AdminEntityLink>
                  <RecordBusinessId id={row.business_id ?? row.v1_opportunity_id} className="mt-0.5 block" />
                </td>
                <td className="px-3 py-1.5 text-slate-700">
                  <AdminEntityLink
                    href={companyFullPageHref(row.linked_company_business_id ?? row.company_id)}
                    className={`${theme.link} underline-offset-2 hover:underline`}
                    fallback={row.linked_company_name ?? "No Company"}
                  >
                    {row.linked_company_name}
                  </AdminEntityLink>
                </td>
                <td className="px-3 py-1.5 text-slate-700">
                  <AdminEntityLink
                    href={contactFullPageHref(row.primary_contact_business_id ?? row.primary_contact_id)}
                    className={`${theme.link} underline-offset-2 hover:underline`}
                  >
                    {row.primary_contact_name}
                  </AdminEntityLink>
                </td>
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
                    editHref={opportunityWorkspaceHref(row, "overview", "edit", listReturnTo)}
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
