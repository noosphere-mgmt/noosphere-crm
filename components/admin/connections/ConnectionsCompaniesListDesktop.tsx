"use client";

import Link from "next/link";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";
import {
  formatCompanyRoles,
  formatCoverage,
  formatDateLabel,
} from "@/lib/connectionsDisplay";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: ConnectionsCompaniesListState["sortKey"];
  activeKey: ConnectionsCompaniesListState["sortKey"];
  sortDir: ConnectionsCompaniesListState["sortDir"];
  onSort: (key: ConnectionsCompaniesListState["sortKey"]) => void;
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

export function ConnectionsCompaniesListDesktop({
  state,
}: {
  state: ConnectionsCompaniesListState;
}) {
  const {
    rows,
    searchParams,
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
            <SortableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Primary Contact" sortKey="contact" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Role" sortKey="role" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader
              label="Coverage"
              sortKey="coverage"
              activeKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              className="w-[220px]"
            />
            <SortableHeader label="Open Opps" sortKey="opportunities" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="w-24 px-3 py-1.5 align-top font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                No companies yet.
              </td>
            </tr>
          ) : displayedRows.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                No companies match your search.
              </td>
            </tr>
          ) : (
            displayedRows.map((row) => {
              const id = String(row.id);
              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.company_name}`}
                      checked={selected.has(id)}
                      onChange={() => toggleOne(id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <Link
                      href={companyDrawerHref("/admin/companies", searchParams, row.id, "overview")}
                      className={`block w-full cursor-pointer text-left font-medium ${connectionsGlassClasses.link}`}
                    >
                      {row.company_name}
                    </Link>
                    <RecordBusinessId id={row.business_id ?? row.v1_company_id} className="mt-0.5 block" />
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{row.primary_contact_name ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{formatCompanyRoles(row.roles)}</td>
                  <td className="px-3 py-1.5 text-slate-700">
                    <div className="w-[220px] max-w-[220px] whitespace-normal break-words">
                      {formatCoverage(row.coverage)}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{row.open_opportunities ?? 0}</td>
                  <td className="px-3 py-1.5 text-slate-700">{formatDateLabel(row.updated_at)}</td>
                  <td className="px-3 py-1.5">
                    <ModuleRowActions
                      module="connections"
                      viewHref={companyDrawerHref("/admin/companies", searchParams, row.id, "overview")}
                      editHref={companyDrawerHref("/admin/companies", searchParams, row.id, "overview", "edit")}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
