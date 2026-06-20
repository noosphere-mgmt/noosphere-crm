"use client";

import {
  usePremisesFiltersBar,
  type PremisesFiltersBarProps,
} from "@/components/admin/properties-v1/usePremisesFiltersBar";
import {
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_OPERATING_MODELS,
  V1_PROPERTY_TYPES,
} from "@/lib/v1ListValues";

export function PremisesFiltersBarDesktop(props: PremisesFiltersBarProps) {
  const { theme, filters, cities, districts, isPending, search, setSearch, patch, resetAll, hasActiveFilters } =
    usePremisesFiltersBar(props);

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
      <div className="border-b border-slate-100 px-3 py-2">{searchInput}</div>

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <select
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
        </select>

        <select
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
        </select>

        <select
          aria-label="Property type"
          value={filters.property_type ?? ""}
          onChange={(e) => patch({ property_type: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">Property type</option>
          {V1_PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          aria-label="Operating model"
          value={filters.operating_model ?? ""}
          onChange={(e) => patch({ operating_model: e.target.value || undefined })}
          className={theme.searchSelect}
        >
          <option value="">Operating model</option>
          {V1_OPERATING_MODELS.map((t) => (
            <option key={t} value={t}>
              {t}
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

        <button
          type="button"
          onClick={resetAll}
          disabled={!hasActiveFilters}
          className="ml-auto rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-default disabled:opacity-40"
        >
          Reset all
        </button>
      </div>
    </div>
  );
}
