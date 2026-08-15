"use client";

import { useEffect, useState } from "react";
import {
  MobileFilterField,
  PropertiesMobileSearchRow,
} from "@/components/admin/properties-v1/PropertiesMobileSearchRow";
import {
  usePremisesFiltersBar,
  type PremisesFiltersBarProps,
} from "@/components/admin/properties-v1/usePremisesFiltersBar";
import {
  SERVICED_OFFICE_OFFERS,
  YES_NO_OPTIONS,
} from "@/lib/premisesCommercial";
import {
  PREMISES_ASSET_CLASSES,
  PREMISES_CENTRE_STATUSES,
  PREMISES_PRODUCT_SUBTYPES,
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";
import { BUILDING_TITLES } from "@/lib/lookups";

export function PremisesFiltersBarMobile(props: PremisesFiltersBarProps) {
  const {
    theme,
    filters,
    cities,
    districts,
    isPending,
    search,
    setSearch,
    onSearchFocus,
    onSearchBlur,
    filtersOpen,
    setFiltersOpen,
    patch,
    resetAll,
    hasActiveFilters,
    activeFilterCount,
  } = usePremisesFiltersBar(props);
  const [monthlyRentMax, setMonthlyRentMax] = useState(filters.monthly_rent_max ?? "");
  useEffect(() => {
    setMonthlyRentMax(filters.monthly_rent_max ?? "");
  }, [filters.monthly_rent_max]);
  const subtypeOptions = filters.asset_class && filters.asset_class in PREMISES_PRODUCT_SUBTYPES
    ? PREMISES_PRODUCT_SUBTYPES[filters.asset_class as keyof typeof PREMISES_PRODUCT_SUBTYPES]
    : Object.values(PREMISES_PRODUCT_SUBTYPES).flat();

  const searchInput = (
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      onFocus={onSearchFocus}
      onBlur={onSearchBlur}
      placeholder="Search buildings & premises — names, address, notes…"
      aria-label="Search buildings and premises"
      autoComplete="off"
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
      <MobileFilterField label="Building title">
        <select
          aria-label="Building title"
          value={filters.title ?? ""}
          onChange={(e) => patch({ title: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All titles</option>
          {BUILDING_TITLES.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Asset class">
        <select
          aria-label="Asset class"
          value={filters.asset_class ?? ""}
          onChange={(e) => patch({ asset_class: e.target.value || undefined, product_subtype: undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All asset classes</option>
          {PREMISES_ASSET_CLASSES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Subtype">
        <select
          aria-label="Subtype"
          value={filters.product_subtype ?? ""}
          onChange={(e) => patch({ product_subtype: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All subtypes</option>
          {subtypeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
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
      <MobileFilterField label="View">
        <select
          aria-label="View"
          value={filters.view_type ?? ""}
          onChange={(e) => patch({ view_type: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All views</option>
          <option value="Sea View">Any sea view</option>
          {V1_VIEW_TYPES.map((t) => (
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
      <MobileFilterField label="Centre status">
        <select
          aria-label="Centre status"
          value={filters.centre_status ?? ""}
          onChange={(e) => patch({ centre_status: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">All centre statuses</option>
          {PREMISES_CENTRE_STATUSES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Operator">
        <input
          type="search"
          aria-label="Operator"
          placeholder="Operator name"
          defaultValue={filters.operator ?? ""}
          onBlur={(e) => patch({ operator: e.target.value.trim() || undefined })}
          className={`${theme.searchSelect} w-full`}
        />
      </MobileFilterField>
      <MobileFilterField label="Unique Address?">
        <select
          aria-label="Unique Address"
          value={filters.offers_unique_address ?? ""}
          onChange={(e) => patch({ offers_unique_address: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">Any</option>
          {YES_NO_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Stamp Duty?">
        <select
          aria-label="Stamp Duty"
          value={filters.offers_stamp_duty ?? ""}
          onChange={(e) => patch({ offers_stamp_duty: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">Any</option>
          {YES_NO_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Offers">
        <select
          aria-label="Offers"
          value={filters.package_offers ?? ""}
          onChange={(e) => patch({ package_offers: e.target.value || undefined })}
          className={`${theme.searchSelect} w-full`}
        >
          <option value="">Any offer</option>
          {SERVICED_OFFICE_OFFERS.map((offer) => (
            <option key={offer} value={offer}>{offer}</option>
          ))}
        </select>
      </MobileFilterField>
      <MobileFilterField label="Max monthly rent">
        <input
          type="number"
          min={0}
          step="1"
          inputMode="decimal"
          aria-label="Max monthly rent"
          placeholder="Max monthly rent"
          value={monthlyRentMax}
          onChange={(e) => setMonthlyRentMax(e.target.value)}
          onBlur={() =>
            patch({ monthly_rent_max: monthlyRentMax.trim() || undefined })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              patch({ monthly_rent_max: monthlyRentMax.trim() || undefined });
            }
          }}
          className={`${theme.searchSelect} w-full`}
        />
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
        resetAfterSearch
      />
    </div>
  );
}
