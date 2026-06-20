"use client";

import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import type { ConnectionsContactsListState } from "@/components/admin/connections/useConnectionsContactsList";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { formatCoverage, formatDateLabel } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: ConnectionsContactsListState["sortKey"];
  activeKey: ConnectionsContactsListState["sortKey"];
  sortDir: ConnectionsContactsListState["sortDir"];
  onSort: (key: ConnectionsContactsListState["sortKey"]) => void;
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

export function ConnectionsContactsListDesktop({
  state,
  onOpenContact,
  onOpenCompany,
}: {
  state: ConnectionsContactsListState;
  onOpenContact: (id: number) => void;
  onOpenCompany: (id: number) => void;
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
            <SortableHeader label="Name" sortKey="name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-1.5 align-top font-medium">Open opps</th>
            <SortableHeader
              label="Coverage"
              sortKey="coverage"
              activeKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              className="w-[220px]"
            />
            <th className="px-3 py-1.5 align-top font-medium">Primary</th>
            <SortableHeader label="Updated" sortKey="updated" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <th className="w-24 px-3 py-1.5 align-top font-medium">Actions</th>
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
                    <button
                      type="button"
                      onClick={() => onOpenContact(row.id)}
                      className={`text-left ${connectionsGlassClasses.link}`}
                    >
                      {getContactLabel(row)}
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    <button
                      type="button"
                      onClick={() => onOpenCompany(row.company_id)}
                      className={`text-left ${connectionsGlassClasses.link}`}
                    >
                      {row.company_name ?? `#${row.company_id}`}
                    </button>
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
