"use client";

import type { ReactNode } from "react";
import { IconX } from "@/components/admin/ModuleActionIcons";

/** Mobile search + Filters button on one row (Properties module). */
export function PropertiesMobileSearchRow({
  search,
  activeFilterCount = 0,
  filtersOpen,
  onToggleFilters,
  filterPanel,
  onReset,
  showReset = false,
  showFilters = true,
}: {
  search: ReactNode;
  activeFilterCount?: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  filterPanel: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
  showFilters?: boolean;
}) {
  return (
    <>
      <div className="mb-2 flex items-center gap-1.5">
        <div className="min-w-0 flex-1 [&_input]:py-1.5 [&_input]:text-sm">{search}</div>
        {showFilters ? (
          <button
            type="button"
            onClick={onToggleFilters}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-slate-800 px-1.5 py-px text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        ) : null}
        {showReset && onReset && activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 rounded-md px-1.5 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
          >
            Reset
          </button>
        ) : null}
      </div>

      {showFilters && filtersOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/25"
            onClick={onToggleFilters}
            aria-label="Close filters"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
              <button
                type="button"
                onClick={onToggleFilters}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close filters"
              >
                <IconX />
              </button>
            </div>
            <div className="space-y-3">{filterPanel}</div>
            <button
              type="button"
              onClick={onToggleFilters}
              className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            >
              Apply
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

export function MobileFilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block w-full text-sm">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
