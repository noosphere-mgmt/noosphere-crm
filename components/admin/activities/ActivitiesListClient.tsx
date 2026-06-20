"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, useEffect } from "react";
import { bulkDeleteActivitiesAction, bulkDuplicateActivitiesAction } from "@/app/admin/activities/actions";
import {
  ActivityFormDrawer,
  type ActivityFormDefaults,
} from "@/components/admin/activities/ActivityFormDrawer";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { useActivitiesListSelection } from "@/components/admin/activities/ActivitiesListSelectionContext";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { ModulePageHeader } from "@/components/admin/ModulePageHeader";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { MobileFilterBar, MobileFilterField } from "@/components/admin/mobile/MobileFilterSheet";
import {
  formatActivityDate,
  formatActivityNotesPreview,
  formatActivityPremisesListCell,
} from "@/lib/activitiesDisplay";
import {
  activityMatchesGlobalSearch,
  activityMatchesQuickFilters,
  EMPTY_ACTIVITIES_QUICK_FILTERS,
} from "@/lib/activitiesList";
import { ACTIVITY_TYPES } from "@/lib/activityValues";
import type { ActivityListRow } from "@/lib/repos/activities";

export function ActivitiesListClient({
  rows,
  initialActivityId,
}: {
  rows: ActivityListRow[];
  initialActivityId?: string;
}) {
  const router = useRouter();
  const theme = moduleAccentClasses("activities");
  const { selected, toggleOne, toggleAll, someSelected, selectedCount, clearSelection } =
    useActivitiesListSelection();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState(EMPTY_ACTIVITIES_QUICK_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityListRow | null>(null);
  const [createDefaults, setCreateDefaults] = useState<ActivityFormDefaults | undefined>();
  const [pending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (!initialActivityId) return;
    const row = rows.find((r) => r.activity_id === initialActivityId);
    if (!row) return;
    setEditing(null);
    setCreateDefaults(undefined);
    setEditing(row);
    setDrawerOpen(true);
  }, [initialActivityId, rows]);

  const companyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.company_id && row.company_name) map.set(String(row.company_id), row.company_name);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const contactOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.contact_id && row.contact_name) map.set(String(row.contact_id), row.contact_name);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const opportunityOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.opportunity_id && row.opportunity_name) {
        map.set(String(row.opportunity_id), row.opportunity_name);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const displayedRows = useMemo(
    () =>
      rows.filter((row) => {
        if (!activityMatchesQuickFilters(row, filters)) return false;
        if (!activityMatchesGlobalSearch(row, searchQuery)) return false;
        return true;
      }),
    [rows, filters, searchQuery],
  );

  const displayedIds = useMemo(() => displayedRows.map((r) => r.activity_id), [displayedRows]);
  useSyncListingExportIds(displayedIds);
  const allSelected = displayedIds.length > 0 && displayedIds.every((id) => selected.has(id));

  const selectedIds = useMemo(() => [...selected], [selected]);

  function handleToggleAll() {
    toggleAll(displayedIds, !allSelected);
  }

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected activities?`)) return;
    const formData = new FormData();
    formData.set("activity_ids", [...selected].join(","));
    startTransition(async () => {
      await bulkDeleteActivitiesAction(formData);
      clearSelection();
      router.refresh();
    });
  }

  function onBulkCopy() {
    if (!someSelected) return;
    const formData = new FormData();
    formData.set("activity_ids", [...selected].join(","));
    startTransition(async () => {
      const result = await bulkDuplicateActivitiesAction(formData);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      clearSelection();
      router.refresh();
    });
  }

  const colSpan = 9;

  const activeFilterCount = [
    filters.activity_type,
    filters.company_id,
    filters.contact_id,
    filters.opportunity_id,
    filters.date_from,
    filters.date_to,
  ].filter(Boolean).length;

  const filterPanel = (
    <>
      <MobileFilterField label="Type">
        <select
          value={filters.activity_type}
          onChange={(e) => setFilters((f) => ({ ...f, activity_type: e.target.value }))}
          className={`${theme.searchSelect} w-full md:min-w-[8.5rem]`}
        >
          <option value="">All types</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Company">
        <select
          value={filters.company_id}
          onChange={(e) => setFilters((f) => ({ ...f, company_id: e.target.value }))}
          className={`${theme.searchSelect} w-full md:min-w-[8.5rem]`}
        >
          <option value="">All</option>
          {companyOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Contact">
        <select
          value={filters.contact_id}
          onChange={(e) => setFilters((f) => ({ ...f, contact_id: e.target.value }))}
          className={`${theme.searchSelect} w-full md:min-w-[8.5rem]`}
        >
          <option value="">All</option>
          {contactOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Opportunity">
        <select
          value={filters.opportunity_id}
          onChange={(e) => setFilters((f) => ({ ...f, opportunity_id: e.target.value }))}
          className={`${theme.searchSelect} w-full md:min-w-[8.5rem]`}
        >
          <option value="">All</option>
          {opportunityOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="From">
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
          className={theme.searchInput}
        />
      </MobileFilterField>
      <MobileFilterField label="To">
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
          className={theme.searchInput}
        />
      </MobileFilterField>
    </>
  );

  const desktopFilterPanel = (
    <div className="mt-2 rounded-md border border-slate-200 bg-white p-3 text-sm">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Type</span>
          <select
            value={filters.activity_type}
            onChange={(e) => setFilters((f) => ({ ...f, activity_type: e.target.value }))}
            className={`${theme.searchSelect} w-full`}
          >
            <option value="">All types</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Company</span>
          <select
            value={filters.company_id}
            onChange={(e) => setFilters((f) => ({ ...f, company_id: e.target.value }))}
            className={`${theme.searchSelect} w-full`}
          >
            <option value="">All</option>
            {companyOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Contact</span>
          <select
            value={filters.contact_id}
            onChange={(e) => setFilters((f) => ({ ...f, contact_id: e.target.value }))}
            className={`${theme.searchSelect} w-full`}
          >
            <option value="">All</option>
            {contactOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Opportunity</span>
          <select
            value={filters.opportunity_id}
            onChange={(e) => setFilters((f) => ({ ...f, opportunity_id: e.target.value }))}
            className={`${theme.searchSelect} w-full`}
          >
            <option value="">All</option>
            {opportunityOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">From</span>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            className={theme.searchInput}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">To</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            className={theme.searchInput}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_ACTIVITIES_QUICK_FILTERS)}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );

  function openNewActivity() {
    setEditing(null);
    setCreateDefaults(undefined);
    setDrawerOpen(true);
  }

  return (
    <>
      <ModulePageHeader
        title="Activities"
        module="activities"
        actions={
          <>
            <ModuleListingBulkActions
              module="activities"
              importObjectType="activities"
              selectedCount={selectedCount}
              someSelected={someSelected}
              selectedIds={selectedIds}
              isPending={pending}
              onDelete={onBulkDelete}
              onCopy={onBulkCopy}
              copyTitle="Copy selected"
            />
            <button type="button" className={`${theme.primaryButton} hidden md:inline-flex`} onClick={openNewActivity}>
              New
            </button>
          </>
        }
      />

      <div className="mb-3">
        <div className="md:hidden">
          <MobileFilterBar
            search={
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, type, company, contact…"
                aria-label="Search activities"
                className={theme.searchInput}
              />
            }
            activeFilterCount={activeFilterCount}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((v) => !v)}
            filterPanel={filterPanel}
            showReset={activeFilterCount > 0}
            onReset={() => setFilters(EMPTY_ACTIVITIES_QUICK_FILTERS)}
          />
        </div>

        <div className="hidden md:block">
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes, type, company, contact…"
              aria-label="Search activities"
              className={`${theme.searchInput} min-w-[16rem] flex-1`}
            />
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
          {filtersOpen ? desktopFilterPanel : null}
        </div>
      </div>

      {/* Mobile floating quick-add */}
      <button
        type="button"
        onClick={openNewActivity}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-20 rounded-full bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-lg md:hidden"
      >
        +
      </button>

      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={rows.length}
        label="Activities"
        selectedCount={selectedCount}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-10 px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  aria-label="Select all activities"
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-3 py-1.5 font-medium">Date</th>
              <th className="px-3 py-1.5 font-medium">Type</th>
              <th className="px-3 py-1.5 font-medium">Company / Contact</th>
              <th className="px-3 py-1.5 font-medium">Premises</th>
              <th className="min-w-[12rem] px-3 py-1.5 font-medium">Notes</th>
              <th className="w-20 px-3 py-1.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-500">
                  {rows.length === 0 ? "No activities yet." : "No activities match your filters."}
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => (
                <tr
                  key={row.activity_id}
                  className={`border-t border-slate-100 align-top hover:bg-slate-50 ${pending ? "opacity-60" : ""}`}
                  onClick={() => {
                    setEditing(row);
                    setDrawerOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setEditing(row);
                      setDrawerOpen(true);
                    }
                  }}
                >
                  <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.activity_id)}
                      onChange={() => toggleOne(row.activity_id)}
                      aria-label={`Select ${row.activity_type}`}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-slate-700">{formatActivityDate(row)}</td>
                  <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-900">{row.activity_type}</td>
                  <td className="px-3 py-1.5 text-slate-700" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-0.5">
                      {row.company_id ? (
                        <Link href={`/admin/companies?company=${row.company_id}&tab=activities`} className={theme.link}>
                          {row.company_name ?? `#${row.company_id}`}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {row.contact_id ? (
                        <Link
                          href={`/admin/contacts?contact=${row.contact_id}&tab=activities`}
                          className="text-xs text-slate-500 hover:underline"
                        >
                          {row.contact_name ?? `#${row.contact_id}`}
                        </Link>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{formatActivityPremisesListCell(row.premises_label)}</td>
                  <td className="max-w-xs px-3 py-1.5 text-slate-600">
                    <p className="line-clamp-2 text-xs leading-snug">{formatActivityNotesPreview(row.notes)}</p>
                  </td>
                  <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
                    <ModuleRowActions
                      module="activities"
                      onEdit={() => {
                        setEditing(row);
                        setDrawerOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ActivityFormDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
          setCreateDefaults(undefined);
        }}
        activity={editing}
        defaults={createDefaults}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
