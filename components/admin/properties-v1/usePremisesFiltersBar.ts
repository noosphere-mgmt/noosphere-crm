"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchFocusedRef = useRef(false);
  const lastPushedQRef = useRef((filters.q ?? "").trim());

  // Sync from URL only for external changes (back/forward/reset), never while typing.
  useEffect(() => {
    const urlQ = (filters.q ?? "").trim();
    if (searchFocusedRef.current) return;
    if (urlQ === lastPushedQRef.current) return;
    lastPushedQRef.current = urlQ;
    setSearch(filters.q ?? "");
  }, [filters.q]);

  const apply = useCallback(
    (next: PremisesFlatFilters) => {
      const params = filtersToParams(next, searchParamsRef.current);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/admin/properties?${qs}` : "/admin/properties");
      });
    },
    [router],
  );

  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed === lastPushedQRef.current) return;

    const timer = window.setTimeout(() => {
      const next = search.trim();
      if (next === lastPushedQRef.current) return;
      lastPushedQRef.current = next;
      const params = new URLSearchParams(searchParamsRef.current.toString());
      params.delete("premises");
      params.delete("mode");
      if (next) params.set("q", next);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/admin/properties?${qs}` : "/admin/properties");
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search, router]);

  function patch(partial: Partial<PremisesFlatFilters>) {
    apply({ ...filters, ...partial });
  }

  function resetAll() {
    searchFocusedRef.current = false;
    lastPushedQRef.current = "";
    setSearch("");
    startTransition(() => {
      router.replace("/admin/properties");
    });
  }

  const onSearchFocus = () => {
    searchFocusedRef.current = true;
  };

  const onSearchBlur = () => {
    searchFocusedRef.current = false;
    const urlQ = (filters.q ?? "").trim();
    if (urlQ !== lastPushedQRef.current && urlQ === search.trim()) {
      lastPushedQRef.current = urlQ;
    }
  };

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
    onSearchFocus,
    onSearchBlur,
    filtersOpen,
    setFiltersOpen,
    patch,
    resetAll,
    hasActiveFilters,
    activeFilterCount,
  };
}
