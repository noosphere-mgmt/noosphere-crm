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
import { IconX } from "@/components/admin/ModuleActionIcons";
import { ModulePageHeader } from "@/components/admin/ModulePageHeader";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
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
  const [viewing, setViewing] = useState<ActivityListRow | null>(null);
  const [createDefaults, setCreateDefaults] = useState<ActivityFormDefaults | undefined>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!initialActivityId) return;
    const row = rows.find((r) => r.activity_id === initialActivityId);
    if (!row) return;
    setEditing(null);
    setCreateDefaults(undefined);
    setViewing(row);
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
            <button
              type="button"
              className={theme.primaryButton}
              onClick={() => {
                setEditing(null);
                setViewing(null);
                setCreateDefaults(undefined);
                setDrawerOpen(true);
              }}
            >
              + New Activity
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="block min-w-0 flex-1 text-sm">
          <span className="mb-1 block text-xs text-slate-500">Search</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Notes, type, company, contact, opportunity, premises…"
            className={theme.searchInput}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-500">Type</span>
          <select
            value={filters.activity_type}
            onChange={(e) => setFilters((f) => ({ ...f, activity_type: e.target.value }))}
            className={theme.searchSelect}
          >
            <option value="">All types</option>
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-500">Company</span>
          <select
            value={filters.company_id}
            onChange={(e) => setFilters((f) => ({ ...f, company_id: e.target.value }))}
            className={theme.searchSelect}
          >
            <option value="">All</option>
            {companyOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-500">Contact</span>
          <select
            value={filters.contact_id}
            onChange={(e) => setFilters((f) => ({ ...f, contact_id: e.target.value }))}
            className={theme.searchSelect}
          >
            <option value="">All</option>
            {contactOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-500">Opportunity</span>
          <select
            value={filters.opportunity_id}
            onChange={(e) => setFilters((f) => ({ ...f, opportunity_id: e.target.value }))}
            className={theme.searchSelect}
          >
            <option value="">All</option>
            {opportunityOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-500">From</span>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
            className={theme.searchInput}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-500">To</span>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
            className={theme.searchInput}
          />
        </label>
      </div>

      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={rows.length}
        label="Activities"
        selectedCount={selectedCount}
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
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
              <th className="px-3 py-1.5 font-medium">Company</th>
              <th className="px-3 py-1.5 font-medium">Contact</th>
              <th className="px-3 py-1.5 font-medium">Opportunity</th>
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
                <tr key={row.activity_id} className={`border-t border-slate-100 align-top ${pending ? "opacity-60" : ""}`}>
                  <td className="px-3 py-1.5">
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
                  <td className="px-3 py-1.5 text-slate-700">
                    {row.company_id ? (
                      <Link href={`/admin/companies?company=${row.company_id}&tab=activities`} className={theme.link}>
                        {row.company_name ?? `#${row.company_id}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {row.contact_id ? (
                      <Link href={`/admin/contacts?contact=${row.contact_id}&tab=activities`} className={theme.link}>
                        {row.contact_name ?? `#${row.contact_id}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {row.opportunity_id ? (
                      <Link href={`/admin/opportunities/${row.opportunity_id}?tab=activities`} className={theme.link}>
                        {row.opportunity_name ?? `#${row.opportunity_id}`}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{formatActivityPremisesListCell(row.premises_label)}</td>
                  <td className="max-w-xs px-3 py-1.5 text-slate-600">
                    <p className="line-clamp-2 text-xs leading-snug">{formatActivityNotesPreview(row.notes)}</p>
                  </td>
                  <td className="px-3 py-1.5">
                    <ModuleRowActions
                      module="activities"
                      onView={() => setViewing(row)}
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

      {viewing ? (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-slate-900/10" onClick={() => setViewing(null)} aria-label="Close" />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-amber-100 bg-white shadow-xl">
            <div className="sticky top-0 flex shrink-0 items-start justify-between border-b border-amber-100 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-amber-800">{viewing.activity_type}</p>
                <h3 className="text-lg font-semibold text-slate-900">{formatActivityDate(viewing)}</h3>
              </div>
              <button type="button" onClick={() => setViewing(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">
                <IconX />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm">
              <dl className="space-y-3">
                {viewing.company_name ? (
                  <div>
                    <dt className="text-xs text-slate-500">Company</dt>
                    <dd>{viewing.company_name}</dd>
                  </div>
                ) : null}
                {viewing.contact_name ? (
                  <div>
                    <dt className="text-xs text-slate-500">Contact</dt>
                    <dd>{viewing.contact_name}</dd>
                  </div>
                ) : null}
                {viewing.opportunity_name ? (
                  <div>
                    <dt className="text-xs text-slate-500">Opportunity</dt>
                    <dd>{viewing.opportunity_name}</dd>
                  </div>
                ) : null}
                {viewing.premises_label ? (
                  <div>
                    <dt className="text-xs text-slate-500">Premises</dt>
                    <dd>{viewing.premises_label}</dd>
                  </div>
                ) : null}
                {viewing.notes?.trim() ? (
                  <div>
                    <dt className="text-xs text-slate-500">Notes</dt>
                    <dd className="whitespace-pre-wrap">{viewing.notes}</dd>
                  </div>
                ) : null}
              </dl>
              <button
                type="button"
                className="mt-4 text-sm font-medium text-amber-800 hover:underline"
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                  setDrawerOpen(true);
                }}
              >
                Edit activity
              </button>
            </div>
          </aside>
        </>
      ) : null}

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
