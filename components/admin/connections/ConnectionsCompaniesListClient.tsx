"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ConnectionsRelationshipTypeFilters } from "@/components/admin/connections/ConnectionsRelationshipTypeFilters";
import { ConnectionsSearchToolbar } from "@/components/admin/connections/ConnectionsSearchToolbar";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";
import {
  formatCompanyRoles,
  formatCoverage,
  formatDateLabel,
  type ConnectionCompanyListRow,
} from "@/lib/connectionsDisplay";
import {
  companyMatchesGlobalSearch,
  companyMatchesRole,
  EMPTY_CONNECTIONS_QUICK_FILTERS,
  matchesQuickFilters,
} from "@/lib/connectionsList";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import type { CompanyRole } from "@/lib/types/entities";
import { useSearchParams } from "next/navigation";
import { MobileCard, MobileCardList, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { MobileContactActions } from "@/components/admin/mobile/MobileContactActions";

type SortKey = "company" | "contact" | "role" | "coverage" | "opportunities" | "updated";
type SortDir = "asc" | "desc";

function compareText(a: string, b: string, dir: SortDir): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

function compareNum(a: number, b: number, dir: SortDir): number {
  return dir === "asc" ? a - b : b - a;
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

export function ConnectionsCompaniesListClient({
  rows,
}: {
  rows: ConnectionCompanyListRow[];
}) {
  const searchParams = useSearchParams();
  const roleFilter = (searchParams.get("role") as CompanyRole | null) || null;
  const { selected, toggleOne, toggleAll, selectedCount } = useConnectionsListSelection();

  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState(EMPTY_CONNECTIONS_QUICK_FILTERS);

  const countries = useMemo(
    () => [...new Set(rows.map((r) => r.country).filter(Boolean))].sort() as string[],
    [rows],
  );
  const cities = useMemo(
    () => [...new Set(rows.map((r) => r.city).filter(Boolean))].sort() as string[],
    [rows],
  );

  const displayedRows = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (!companyMatchesRole(row.roles, roleFilter)) return false;
      if (!matchesQuickFilters(row, quickFilters)) return false;
      if (!companyMatchesGlobalSearch(row, searchQuery)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "company":
          return compareText(a.company_name, b.company_name, sortDir);
        case "contact":
          return compareText(a.primary_contact_name ?? "", b.primary_contact_name ?? "", sortDir);
        case "role":
          return compareText(formatCompanyRoles(a.roles), formatCompanyRoles(b.roles), sortDir);
        case "coverage":
          return compareText(formatCoverage(a.coverage), formatCoverage(b.coverage), sortDir);
        case "opportunities":
          return compareNum(a.open_opportunities ?? 0, b.open_opportunities ?? 0, sortDir);
        case "updated":
          return compareText(a.updated_at ?? "", b.updated_at ?? "", sortDir);
        default:
          return 0;
      }
    });
  }, [rows, quickFilters, roleFilter, searchQuery, sortKey, sortDir]);

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
        showRelationshipType
        relationshipTypeSlot={<ConnectionsRelationshipTypeFilters />}
      />
      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={rows.length}
        label="Companies"
        selectedCount={selectedCount}
      />
      <MobileCardList>
        {displayedRows.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No companies yet." : "No companies match your search."}
          </p>
        ) : (
          displayedRows.map((row) => (
            <Link
              key={row.id}
              href={companyDrawerHref("/admin/companies", searchParams, row.id, "overview")}
              className="block"
            >
              <MobileCard>
                <MobileCardTitle>{row.company_name}</MobileCardTitle>
                <MobileCardMeta>
                  {formatCompanyRoles(row.roles)} · {row.open_opportunities ?? 0} open opps
                </MobileCardMeta>
                <MobileCardMeta>
                  {row.primary_contact_name ?? "No primary contact"}
                  {row.coverage?.length ? ` · ${formatCoverage(row.coverage)}` : ""}
                </MobileCardMeta>
                <MobileContactActions
                  phone={row.primary_contact_phone}
                  email={row.primary_contact_email}
                />
              </MobileCard>
            </Link>
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
    </>
  );
}
