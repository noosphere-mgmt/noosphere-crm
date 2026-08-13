"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateContactAction } from "@/app/admin/contacts/actions";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { SortableTableHeader } from "@/components/admin/SortableTableHeader";
import type { ConnectionsContactsListState } from "@/components/admin/connections/useConnectionsContactsList";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import { formatCoverage, formatDateLabel } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";

export function ConnectionsContactsListDesktop({
  state,
  onOpenContact,
  onOpenCompany: _onOpenCompany,
}: {
  state: ConnectionsContactsListState;
  onOpenContact: (id: number | string) => void;
  onOpenCompany: (id: number | string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  function onDuplicate(contactId: number) {
    startTransition(async () => {
      const result = await duplicateContactAction(contactId);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      router.refresh();
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
            <SortableTableHeader label="Name" sortKey="name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableTableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-1.5 align-top font-medium">Open opps</th>
            <SortableTableHeader
              label="Coverage"
              sortKey="coverage"
              activeKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              className="w-[220px]"
            />
            <th className="px-3 py-1.5 align-top font-medium">Primary</th>
            <SortableTableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="w-28 px-3 py-1.5 align-top font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                No contacts yet.
              </td>
            </tr>
          ) : displayedRows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                No contacts match your search.
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
                      aria-label={`Select ${getContactLabel(row)}`}
                      checked={selected.has(id)}
                      onChange={() => toggleOne(id)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-1.5 font-medium">
                    <AdminEntityLink
                      href={contactDrawerHref(
                        "/admin/contacts",
                        searchParams,
                        row.business_id ?? row.v1_contact_id ?? row.id,
                      )}
                      className={`inline-block text-left font-semibold underline-offset-2 hover:underline ${connectionsGlassClasses.link}`}
                    >
                      {getContactLabel(row)}
                    </AdminEntityLink>
                    <RecordBusinessId id={row.business_id ?? row.v1_contact_id} className="mt-0.5 block" />
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    <div className="flex flex-col gap-0.5">
                      <AdminEntityLink
                        href={companyFullPageHref(row.company_business_id ?? row.company_id)}
                        className={`text-left underline-offset-2 hover:underline ${connectionsGlassClasses.link}`}
                        fallback={<span className="text-slate-400">—</span>}
                      >
                        {row.company_name ?? (row.company_id != null ? `#${row.company_id}` : null)}
                      </AdminEntityLink>
                      {row.company_name_zh ? (
                        <span className="text-xs text-slate-500">{row.company_name_zh}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{row.open_opportunities ?? 0}</td>
                  <td className="px-3 py-1.5 text-slate-700">
                    <div className="w-[220px] max-w-[220px] truncate">{formatCoverage(row.coverage)}</div>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{row.is_primary ? "Yes" : "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{formatDateLabel(row.updated_at)}</td>
                  <td className="px-3 py-1.5">
                    <ModuleRowActions
                      module="connections"
                      viewHref={contactDrawerHref("/admin/contacts", searchParams, row.id, "overview")}
                      editHref={contactDrawerHref("/admin/contacts", searchParams, row.id, "overview", "edit")}
                      onDuplicate={isPending ? undefined : () => onDuplicate(row.id)}
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
