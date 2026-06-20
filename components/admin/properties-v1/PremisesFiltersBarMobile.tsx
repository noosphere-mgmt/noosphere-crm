"use client";

import {
  MobileFilterField,
  PropertiesMobileSearchRow,
} from "@/components/admin/properties-v1/PropertiesMobileSearchRow";
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

export function PremisesFiltersBarMobile(props: PremisesFiltersBarProps) {
  const {
    theme,
    filters,
    cities,
    districts,
    isPending,
    search,
    setSearch,
    filtersOpen,
    setFiltersOpen,
    patch,
    resetAll,
    hasActiveFilters,
    activeFilterCount,
  } = usePremisesFiltersBar(props);

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

  const mobileFilterPanel = (
    <>
      <MobileFilterField label="City">
        <select
          aria-label="City"
          value={filters.city ?? ""}
          onChange={(e) => patch({ city: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="District">
        <select
          aria-label="District"
          value={filters.district ?? ""}
          onChange={(e) => patch({ district: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Property type">
        <select
          aria-label="Property type"
          value={filters.property_type ?? ""}
          onChange={(e) => patch({ property_type: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All types</option>
          {V1_PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Operating model">
        <select
          aria-label="Operating model"
          value={filters.operating_model ?? ""}
          onChange={(e) => patch({ operating_model: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All models</option>
          {V1_OPERATING_MODELS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Fit out">
        <select
          aria-label="Fit out condition"
          value={filters.fit_out_condition ?? ""}
          onChange={(e) => patch({ fit_out_condition: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All conditions</option>
          {V1_FIT_OUT_CONDITIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Listing intent">
        <select
          aria-label="Listing Intent"
          value={filters.listing_intent ?? ""}
          onChange={(e) => patch({ listing_intent: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All intents</option>
          {V1_LISTING_INTENTS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Listing status">
        <select
          aria-label="Listing Status"
          value={filters.listing_status ?? ""}
          onChange={(e) => patch({ listing_status: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All statuses</option>
          {V1_LISTING_STATUSES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </MobileFilterField>
    </>
  );

  return (
    <div className={isPending ? "opacity-70" : ""}>
      <PropertiesMobileSearchRow
        search={searchInput}
        activeFilterCount={activeFilterCount}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
        filterPanel={mobileFilterPanel}
        showReset={hasActiveFilters}
        onReset={resetAll}
      />
    </div>
  );
}
