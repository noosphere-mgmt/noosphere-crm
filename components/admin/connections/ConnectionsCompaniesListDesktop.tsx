"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { SortableTableHeader } from "@/components/admin/SortableTableHeader";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";
import { confirmDeleteCompany } from "@/components/admin/mobile/mobileListDelete";
import {
  formatCompanyRoles,
  formatCoverage,
  formatDateLabel,
} from "@/lib/connectionsDisplay";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { companyDrawerHref, contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";

export function ConnectionsCompaniesListDesktop({
  state,
}: {
  state: ConnectionsCompaniesListState;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();
  const {
    rows,
    searchParams,
    selected,
    toggleOne,
    toggleAll,
    sortKey,
    sortDir,
    displayedRows,
    selectionIds,
    allDisplayedSelected,
    handleSort,
  } = state;

  function deleteCompanyRow(id: number) {
    startDelete(async () => {
      const deleted = await confirmDeleteCompany(id);
      if (deleted) router.refresh();
    });
  }

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
                onChange={(e) => toggleAll(selectionIds, e.target.checked)}
                className="rounded border-slate-300"
              />
            </th>
            <SortableTableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Primary Contact" sortKey="contact" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Role" sortKey="role" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader
              label="Coverage"
              sortKey="coverage"
              activeKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              className="w-[220px]"
            />
            <SortableTableHeader label="Open Opps" sortKey="opportunities" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
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
                    <AdminEntityLink
                      href={companyFullPageHref(row.business_id ?? row.v1_company_id ?? row.id)}
                      className={`block w-full cursor-pointer text-left font-medium ${connectionsGlassClasses.link}`}
                    >
                      {row.company_name}
                    </AdminEntityLink>
                    {row.company_name_zh ? (
                      <span className="mt-0.5 block text-xs text-slate-500">{row.company_name_zh}</span>
                    ) : null}
                    <RecordBusinessId id={row.business_id ?? row.v1_company_id} className="mt-0.5 block" />
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    <AdminEntityLink
                      href={
                        row.primary_contact_business_id || row.primary_contact_id
                          ? contactDrawerHref(
                              "/admin/contacts",
                              searchParams,
                              row.primary_contact_business_id ?? row.primary_contact_id!,
                            )
                          : null
                      }
                      className={`${connectionsGlassClasses.link} underline-offset-2 hover:underline`}
                    >
                      {row.primary_contact_name}
                    </AdminEntityLink>
                  </td>
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
                      onDelete={isDeleting ? undefined : () => deleteCompanyRow(row.id)}
                      deleteLabel={`Delete ${row.company_name}`}
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
