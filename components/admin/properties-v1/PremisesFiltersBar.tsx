"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { PremisesFlatFilters } from "@/lib/repos/premisesV1";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import {
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_OPERATING_MODELS,
  V1_PROPERTY_TYPES,
} from "@/lib/v1ListValues";

type Props = {
  filters: PremisesFlatFilters;
  cities: string[];
  districts: string[];
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
  setOrDelete("property_type", filters.property_type);
  setOrDelete("operating_model", filters.operating_model);
  setOrDelete("fit_out_condition", filters.fit_out_condition);
  setOrDelete("listing_intent", filters.listing_intent);
  setOrDelete("listing_status", filters.listing_status);

  return params;
}

export function PremisesFiltersBar({ filters, cities, districts }: Props) {
  const theme = moduleAccentClasses("properties");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q ?? "");

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
      filters.property_type ||
      filters.operating_model ||
      filters.fit_out_condition ||
      filters.listing_intent ||
      filters.listing_status,
  );

  return (
    <div
      className={`mb-3 rounded-lg border border-slate-200 bg-white text-sm ${isPending ? "opacity-70" : ""}`}
    >
      <div className="border-b border-slate-100 px-3 py-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search premises, building, operator, district..."
          aria-label="Search premises"
          className={theme.searchInput}
        />
      </div>

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
