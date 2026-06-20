"use client";

import type { ReactNode } from "react";
import { IconX } from "@/components/admin/ModuleActionIcons";

export function MobileFilterBar({
  search,
  activeFilterCount = 0,
  filtersOpen,
  onToggleFilters,
  filterPanel,
  onReset,
  showReset = false,
}: {
  search: ReactNode;
  activeFilterCount?: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  filterPanel: ReactNode;
  onReset?: () => void;
  showReset?: boolean;
}) {
  return (
    <div className="mb-2 rounded-md border border-slate-200 bg-white text-sm">
      <div className="px-2.5 py-1.5">{search}</div>

      {/* Mobile: collapse filters behind button */}
      <div className="flex items-center gap-1.5 border-t border-slate-100 px-2.5 py-1 md:hidden">
        <button
          type="button"
          onClick={onToggleFilters}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Filters
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-slate-800 px-1.5 py-px text-[10px] font-semibold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        {showReset && onReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={activeFilterCount === 0}
            className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            Reset
          </button>
        ) : null}
      </div>

      {filtersOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/25 md:hidden"
            onClick={onToggleFilters}
            aria-label="Close filters"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-xl border border-slate-200 bg-white p-4 shadow-xl md:hidden">
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

      {/* Desktop: inline filters (unchanged from original admin layout) */}
      <div className="hidden flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2 md:flex">
        {filterPanel}
        {showReset && onReset ? (
          <button
            type="button"
            onClick={onReset}
            disabled={activeFilterCount === 0}
            className="ml-auto rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Reset all
          </button>
        ) : null}
      </div>
    </div>
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
