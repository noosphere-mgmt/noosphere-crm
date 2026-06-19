"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectionsSearchToolbar } from "@/components/admin/connections/ConnectionsSearchToolbar";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { contactDrawerHref } from "@/lib/connectionsDrawerNav";
import { formatCoverage, formatDateLabel } from "@/lib/connectionsDisplay";
import { getContactLabel } from "@/lib/contactName";
import {
  contactMatchesGlobalSearch,
  contactMatchesQuickFilters,
  EMPTY_CONNECTIONS_QUICK_FILTERS,
} from "@/lib/connectionsList";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import type { Contact } from "@/lib/types/entities";
import { MobileCard, MobileCardList, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";

type SortKey = "name" | "company" | "coverage" | "updated";
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

export function ConnectionsContactsListClient({
  rows,
  onOpenContact,
  onOpenCompany,
}: {
  rows: Contact[];
  onOpenContact: (id: number) => void;
  onOpenCompany: (id: number) => void;
}) {
  const searchParams = useSearchParams();
  const { selected, toggleOne, toggleAll, selectedCount } = useConnectionsListSelection();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState(EMPTY_CONNECTIONS_QUICK_FILTERS);

  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.company_country).filter(Boolean))].sort() as string[],
    [rows],
  );
  const cities = useMemo(
    () => [...new Set(rows.map((r) => r.company_city).filter(Boolean))].sort() as string[],
    [rows],
  );

  const displayedRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (!contactMatchesQuickFilters(row, quickFilters)) return false;
      if (!contactMatchesGlobalSearch(row, searchQuery)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return compareText(getContactLabel(a), getContactLabel(b), sortDir);
        case "company":
          return compareText(a.company_name ?? "", b.company_name ?? "", sortDir);
        case "coverage":
          return compareText(formatCoverage(a.coverage), formatCoverage(b.coverage), sortDir);
        case "updated":
          return compareText(a.updated_at ?? "", b.updated_at ?? "", sortDir);
        default:
          return 0;
      }
    });
  }, [rows, quickFilters, searchQuery, sortKey, sortDir]);

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
      <ConnectionsSearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        quickFilters={quickFilters}
        onQuickFiltersChange={setQuickFilters}
        countries={countries}
        cities={cities}
      />
      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={rows.length}
        label="Contacts"
        selectedCount={selectedCount}
      />
      <MobileCardList>
        {displayedRows.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No contacts yet." : "No contacts match your search."}
          </p>
        ) : (
          displayedRows.map((row) => (
            <MobileCard key={row.id} onClick={() => onOpenContact(row.id)}>
              <MobileCardTitle>{getContactLabel(row)}</MobileCardTitle>
              <MobileCardMeta>
                {row.company_name ?? "No company"} · {row.open_opportunities ?? 0} open opps
              </MobileCardMeta>
              <MobileCardMeta>
                Updated {formatDateLabel(row.updated_at)}
              </MobileCardMeta>
              <MobileContactActions phone={row.phone} whatsapp={row.whatsapp} email={row.email} />
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
              <SortableHeader label="Name" sortKey="name" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Company" sortKey="company" activeKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="hidden px-3 py-1.5 align-top font-medium lg:table-cell">Open opps</th>
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
                    <td className="hidden px-3 py-1.5 text-slate-700 lg:table-cell">{row.open_opportunities ?? 0}</td>
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
    </>
  );
}
