"use client";

import {
  usePremisesFiltersBar,
  type PremisesFiltersBarProps,
} from "@/components/admin/properties-v1/usePremisesFiltersBar";
import {
  CANONICAL_LISTING_INTENT_LABELS,
  CANONICAL_LISTING_INTENTS,
  PREMISES_ASSET_CLASSES,
  PREMISES_PRODUCT_SUBTYPES,
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";
import { BUILDING_TITLES } from "@/lib/lookups";

export function PremisesFiltersBarDesktop(props: PremisesFiltersBarProps) {
  const { theme, filters, cities, districts, isPending, search, setSearch, patch, resetAll, hasActiveFilters } =
    usePremisesFiltersBar(props);
  const subtypeOptions = filters.asset_class && filters.asset_class in PREMISES_PRODUCT_SUBTYPES
    ? PREMISES_PRODUCT_SUBTYPES[filters.asset_class as keyof typeof PREMISES_PRODUCT_SUBTYPES]
    : Object.values(PREMISES_PRODUCT_SUBTYPES).flat();

  const searchInput = (
    <input
      type="search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search premises, building, operator, district..."
      aria-label="Search premises"
      className={theme.searchInput}
    />
  );

  return (
    <div
      className={`mb-3 rounded-lg border border-slate-200 bg-white text-sm ${isPending ? "opacity-70" : ""}`}
    >
      {!props.hideLocationSearch ? (
        <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
          <div className="min-w-0 flex-1">{searchInput}</div>
          <button
            type="button"
            onClick={resetAll}
            disabled={!hasActiveFilters}
            className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-default disabled:opacity-40"
          >
            Reset all
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {!props.hideLocationSearch ? <select
          aria-label="City"
          value={filters.city ?? ""}
          onChange={(e) => patch({ city: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">City</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select> : null}

        <select
          aria-label="Building title"
          value={filters.title ?? ""}
          onChange={(e) => patch({ title: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">Building title</option>
          {BUILDING_TITLES.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>

        {!props.hideLocationSearch ? <select
          aria-label="District"
          value={filters.district ?? ""}
          onChange={(e) => patch({ district: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">District</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select> : null}

        <select
          aria-label="Asset class"
          value={filters.asset_class ?? ""}
          onChange={(e) => patch({ asset_class: e.target.value || undefined, product_subtype: undefined })}
          className={theme.searchSelect}
        >
          <option value="">Asset class</option>
          {PREMISES_ASSET_CLASSES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Subtype"
          value={filters.product_subtype ?? ""}
          onChange={(e) => patch({ product_subtype: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">Subtype</option>
          {subtypeOptions.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Fit out condition"
          value={filters.fit_out_condition ?? ""}
          onChange={(e) => patch({ fit_out_condition: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">Fit out</option>
          {V1_FIT_OUT_CONDITIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          aria-label="View"
          value={filters.view_type ?? ""}
          onChange={(e) => patch({ view_type: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">View</option>
          <option value="Sea View">Any sea view</option>
          {V1_VIEW_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          aria-label="Listing Intent"
          value={filters.listing_intent ?? ""}
          onChange={(e) => patch({ listing_intent: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">Listing Intent</option>
          {V1_LISTING_INTENTS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          aria-label="Listing Status"
          value={filters.listing_status ?? ""}
          onChange={(e) => patch({ listing_status: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">Listing Status</option>
          {V1_LISTING_STATUSES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {props.hideLocationSearch ? (
          <button
            type="button"
            onClick={resetAll}
            disabled={!hasActiveFilters}
            className="ml-auto rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-default disabled:opacity-40"
          >
            Reset all
          </button>
        ) : null}
      </div>
    </div>
  );
}
