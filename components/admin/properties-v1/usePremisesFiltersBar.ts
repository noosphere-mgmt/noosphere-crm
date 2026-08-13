"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { PremisesFlatFilters } from "@/lib/repos/premisesV1";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export type PremisesFiltersBarProps = {
  filters: PremisesFlatFilters;
  cities: string[];
  districts: string[];
  hideLocationSearch?: boolean;
};

function filtersToParams(filters: PremisesFlatFilters, existing: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(existing.toString());
  params.delete("premises");
  params.delete("mode");

  const setOrDelete = (key: string, value: string | undefined) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };

  setOrDelete("q", filters.q);
  setOrDelete("city", filters.city);
  setOrDelete("district", filters.district);
  setOrDelete("title", filters.title);
  setOrDelete("asset_class", filters.asset_class);
  setOrDelete("product_subtype", filters.product_subtype);
  params.delete("building_type");
  params.delete("property_category");
  params.delete("property_type");
  params.delete("operating_model");
  setOrDelete("fit_out_condition", filters.fit_out_condition);
  setOrDelete("view_type", filters.view_type);
  setOrDelete("listing_intent", filters.listing_intent);
  setOrDelete("listing_status", filters.listing_status);
  setOrDelete("offers_unique_address", filters.offers_unique_address);
  setOrDelete("offers_stamp_duty", filters.offers_stamp_duty);
  setOrDelete("package_product", filters.package_product);
  setOrDelete("price_pax_mth_max", filters.price_pax_mth_max);

  return params;
}

export function usePremisesFiltersBar({ filters, cities, districts }: PremisesFiltersBarProps) {
  const theme = moduleAccentClasses("properties");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setSearch(filters.q ?? "");
  }, [filters.q]);

  const apply = useCallback(
    (next: PremisesFlatFilters) => {
      const params = filtersToParams(next, searchParams);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/admin/properties?${qs}` : "/admin/properties");
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    const trimmed = search.trim();
    const current = (searchParams.get("q") ?? "").trim();
    if (trimmed === current) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("premises");
      params.delete("mode");
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/admin/properties?${qs}` : "/admin/properties");
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search, searchParams, router]);

  function patch(partial: Partial<PremisesFlatFilters>) {
    apply({ ...filters, ...partial });
  }

  function resetAll() {
    setSearch("");
    startTransition(() => {
      router.replace("/admin/properties");
    });
  }

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.city ||
      filters.district ||
      filters.title ||
      filters.asset_class ||
      filters.product_subtype ||
      filters.fit_out_condition ||
      filters.view_type ||
      filters.listing_intent ||
      filters.listing_status ||
      filters.offers_unique_address ||
      filters.offers_stamp_duty ||
      filters.package_product ||
      filters.price_pax_mth_max,
  );

  const activeFilterCount = [
    filters.city,
    filters.district,
    filters.title,
    filters.asset_class,
    filters.product_subtype,
    filters.fit_out_condition,
    filters.view_type,
    filters.listing_intent,
    filters.listing_status,
    filters.offers_unique_address,
    filters.offers_stamp_duty,
    filters.package_product,
    filters.price_pax_mth_max,
  ].filter(Boolean).length;

  return {
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
  };
}
