"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PremisesFiltersBarDesktop } from "@/components/admin/properties-v1/PremisesFiltersBarDesktop";
import { PremisesListDesktop } from "@/components/admin/properties-v1/PremisesListDesktop";
import { PremisesListHeaderDesktop } from "@/components/admin/properties-v1/PremisesListHeaderDesktop";
import { PropertyDrawer, type PropertyDrawerMode } from "@/components/admin/properties-v1/PropertyDrawer";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { buildingFullPageHref } from "@/lib/crmDetailNav";
import { matchesGlobalSearch } from "@/lib/connectionsList";
import type { PremisesViewProps } from "@/components/admin/properties-v1/PremisesDesktop";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";

function buildingMatchesSearch(building: PropertyV1SelectOption, query: string): boolean {
  return matchesGlobalSearch(
    [
      building.label,
      building.name_en,
      building.name_zh,
      building.name_cn,
      building.district,
      building.street_no,
      building.street_name_en,
      building.street_name_zh,
      building.street_name_cn,
      building.full_address,
      building.mtr_station,
      building.description,
      building.remarks,
      building.business_id,
      building.property_id,
      building.city,
      building.country,
    ],
    query,
  );
}

export function PropertiesSplitDesktop(props: PremisesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = moduleAccentClasses("properties");
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [buildingSearch, setBuildingSearch] = useState("");
  const [selectedBuildings, setSelectedBuildings] = useState<Set<string>>(new Set());
  const buildingDrawerMode: PropertyDrawerMode = searchParams.get("building_mode") === "edit" ? "edit" : "view";

  function buildingDrawerHref(propertyId: string, mode: PropertyDrawerMode = "view") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("building", propertyId);
    params.set("building_mode", mode);
    return `/admin/properties?${params.toString()}`;
  }

  function closeBuildingDrawer() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("building");
    params.delete("building_mode");
    const query = params.toString();
    router.replace(query ? `/admin/properties?${query}` : "/admin/properties", { scroll: false });
  }

  function setBuildingDrawerMode(mode: PropertyDrawerMode) {
    if (!props.selectedBuildingProperty) return;
    router.replace(buildingDrawerHref(props.selectedBuildingProperty.property_id, mode), { scroll: false });
  }

  const premisesCountByBuilding = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of props.rows) counts.set(row.property_id, (counts.get(row.property_id) ?? 0) + 1);
    return counts;
  }, [props.rows]);

  const listingCountsByBuilding = useMemo(() => {
    const counts = new Map<string, { lease: number; sale: number }>();
    for (const row of props.rows) {
      const value = counts.get(row.property_id) ?? { lease: 0, sale: 0 };
      const status = `${row.inventory_status ?? ""} ${row.offer_type ?? ""}`.toLowerCase();
      if (status.includes("lease") || status.includes("rent")) value.lease += 1;
      if (status.includes("sale") || status.includes("sell")) value.sale += 1;
      counts.set(row.property_id, value);
    }
    return counts;
  }, [props.rows]);

  const filteredByToolbar = useMemo(() => {
    const matchingBuildingIds = new Set(props.rows.map((row) => row.property_id));
    const query = props.filters.q?.trim().toLowerCase() ?? "";
    const hasPremisesCriteria = Boolean(
      props.filters.asset_class ||
      props.filters.product_subtype ||
      props.filters.title ||
      props.filters.fit_out_condition ||
      props.filters.view_type ||
      props.filters.listing_intent ||
      props.filters.listing_status,
    );
    const hasAnyFilter = Boolean(query || props.filters.city || props.filters.district || hasPremisesCriteria);
    if (!hasAnyFilter) return props.propertyOptions;

    return props.propertyOptions.filter((building) => {
      if (props.filters.city && building.city !== props.filters.city) return false;
      if (props.filters.district && building.district !== props.filters.district) return false;
      if (hasPremisesCriteria) return matchingBuildingIds.has(building.property_id);
      if (!query) return matchingBuildingIds.has(building.property_id);

      // Match buildings by their own fields, or because a linked premise matched `q` in SQL.
      return (
        buildingMatchesSearch(building, props.filters.q ?? query) ||
        matchingBuildingIds.has(building.property_id)
      );
    });
  }, [props.filters, props.propertyOptions, props.rows]);

  const visibleBuildings = useMemo(
    () => filteredByToolbar.filter((building) => buildingMatchesSearch(building, buildingSearch)),
    [filteredByToolbar, buildingSearch],
  );

  const visibleBuildingIds = useMemo(
    () => new Set(visibleBuildings.map((building) => building.property_id)),
    [visibleBuildings],
  );
  const visibleBuildingSelectionIds = useMemo(
    () => visibleBuildings.map((building) => building.property_id),
    [visibleBuildings],
  );

  useEffect(() => {
    if (buildingId != null && !visibleBuildingIds.has(buildingId)) {
      setBuildingId(null);
    }
  }, [buildingId, visibleBuildingIds]);

  useEffect(() => {
    setSelectedBuildings((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (visibleBuildingIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed || next.size !== prev.size ? next : prev;
    });
  }, [visibleBuildingIds]);

  const checkedBuildingIds = useMemo(() => {
    const ids = new Set<string>();
    for (const id of visibleBuildingSelectionIds) {
      if (selectedBuildings.has(id)) ids.add(id);
    }
    return ids;
  }, [visibleBuildingSelectionIds, selectedBuildings]);
  const hasCheckedBuildings = checkedBuildingIds.size > 0;
  const allVisibleBuildingsSelected =
    visibleBuildingSelectionIds.length > 0 &&
    visibleBuildingSelectionIds.every((id) => selectedBuildings.has(id));

  const selectedBuilding = props.propertyOptions.find((building) => building.property_id === buildingId) ?? null;
  const shortlistedPremises = useMemo(
    () => props.rows.filter((row) => visibleBuildingIds.has(row.property_id)),
    [props.rows, visibleBuildingIds],
  );
  const premisesRows = useMemo(() => {
    if (hasCheckedBuildings) {
      return props.rows.filter((row) => checkedBuildingIds.has(row.property_id));
    }
    if (buildingId) {
      return props.rows.filter((row) => row.property_id === buildingId);
    }
    return shortlistedPremises;
  }, [hasCheckedBuildings, checkedBuildingIds, buildingId, props.rows, shortlistedPremises]);

  function toggleBuildingChecked(propertyId: string) {
    setSelectedBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
    setBuildingId((prev) => {
      const willSelect = !selectedBuildings.has(propertyId);
      if (willSelect) return propertyId;
      if (prev === propertyId) return null;
      return prev;
    });
  }

  function toggleAllBuildings(selectAll: boolean) {
    setSelectedBuildings((prev) => {
      const next = new Set(prev);
      if (selectAll) visibleBuildingSelectionIds.forEach((id) => next.add(id));
      else visibleBuildingSelectionIds.forEach((id) => next.delete(id));
      return next;
    });
    if (!selectAll) setBuildingId(null);
  }

  const premisesFocusBuilding =
    selectedBuilding ??
    (checkedBuildingIds.size === 1
      ? visibleBuildings.find((b) => checkedBuildingIds.has(b.property_id)) ?? null
      : null);
  const premisesWorkspaceTitle = hasCheckedBuildings
    ? checkedBuildingIds.size === 1
      ? (premisesFocusBuilding?.label ?? "Selected building")
      : `${checkedBuildingIds.size} selected buildings`
    : selectedBuilding?.label ?? "All premises";

  return (
    <>
      <PremisesListHeaderDesktop showCreate={false} />
      <PremisesFiltersBarDesktop filters={props.filters} cities={props.cities} districts={props.districts} />

      <div className="mt-3 grid h-[calc(100vh-14rem)] min-h-[34rem] grid-cols-[18rem_minmax(0,1fr)] gap-4 items-stretch">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <input
                  type="checkbox"
                  aria-label="Select all buildings"
                  checked={allVisibleBuildingsSelected}
                  onChange={(e) => toggleAllBuildings(e.target.checked)}
                  className="mt-1 rounded border-slate-300"
                  disabled={visibleBuildings.length === 0}
                />
                <div>
                  <h2 className="font-semibold text-slate-900">Buildings</h2>
                  <p className="text-xs text-slate-500">
                    {visibleBuildings.length} of {props.propertyOptions.length}
                    {hasCheckedBuildings ? ` · ${checkedBuildingIds.size} selected` : ""}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/properties/buildings/new"
                className="rounded-lg bg-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
              >
                + Building
              </Link>
            </div>
            <input
              type="search"
              value={buildingSearch}
              onChange={(e) => setBuildingSearch(e.target.value)}
              placeholder="Search buildings…"
              aria-label="Search buildings"
              className={`mt-2 ${theme.searchInput}`}
            />
          </div>

          <div className="admin-list-scroll min-h-0 flex-1 overflow-y-scroll p-2 pb-2">
            <button
              type="button"
              onClick={() => {
                setBuildingId(null);
                setSelectedBuildings(new Set());
              }}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${buildingId === null && !hasCheckedBuildings ? "bg-sky-50 font-semibold text-sky-900 ring-1 ring-sky-100" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <span>All buildings</span>
              <span className="text-xs tabular-nums text-slate-500">{shortlistedPremises.length}</span>
            </button>
            {visibleBuildings.map((building) => {
              const checked = selectedBuildings.has(building.property_id);
              const focused = buildingId === building.property_id || checked;
              return (
                <div
                  key={building.property_id}
                  className={`group mb-1 flex items-start gap-1 rounded-lg pr-1 ${focused ? "bg-sky-50 text-sky-900 ring-1 ring-sky-100" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 text-left text-sm">
                    <input
                      type="checkbox"
                      aria-label={`Select ${building.label}`}
                      checked={checked}
                      onChange={() => toggleBuildingChecked(building.property_id)}
                      className="mt-0.5 rounded border-slate-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={buildingDrawerHref(building.property_id)}
                        scroll={false}
                        className={`line-clamp-2 font-medium text-sky-800 underline-offset-2 hover:underline ${focused ? "font-semibold" : ""}`}
                      >
                        {building.label}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setBuildingId(building.property_id)}
                        className="mt-1 block text-left text-[11px] text-slate-500 hover:text-sky-800"
                        title="Show this building's premises"
                      >
                        {premisesCountByBuilding.get(building.property_id) ?? 0} premises ·{" "}
                        {listingCountsByBuilding.get(building.property_id)?.lease ?? 0} lease ·{" "}
                        {listingCountsByBuilding.get(building.property_id)?.sale ?? 0} sale
                      </button>
                    </div>
                  </div>
                  <Link
                    href={buildingDrawerHref(building.property_id)}
                    scroll={false}
                    aria-label={`Open ${building.label}`}
                    title="Open building drawer"
                    className="mt-2 rounded-md px-2 py-1 text-sky-700 opacity-70 hover:bg-white hover:opacity-100"
                  >
                    ↗
                  </Link>
                </div>
              );
            })}
            {visibleBuildings.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">No buildings match the current filters.</p>
            ) : null}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Premises workspace</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{premisesWorkspaceTitle}</h2>
              <p className="text-xs text-slate-500">{premisesRows.length} premises shown</p>
            </div>
            <div className="flex gap-2">
              {premisesFocusBuilding ? (
                <Link
                  href={
                    buildingFullPageHref(
                      premisesFocusBuilding.business_id ?? premisesFocusBuilding.property_id,
                    ) ?? "/admin/properties/buildings"
                  }
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open building
                </Link>
              ) : null}
              <Link
                href={
                  premisesFocusBuilding
                    ? `/admin/properties/premises/new?property_id=${encodeURIComponent(
                        premisesFocusBuilding.property_id,
                      )}`
                    : "/admin/properties/premises/new"
                }
                className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
              >
                + Premises
              </Link>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <PremisesListDesktop
              {...props}
              rows={premisesRows}
              totalCount={premisesRows.length}
              fillHeight
            />
          </div>
        </section>
      </div>

      <PropertyDrawer
        property={props.selectedBuildingProperty}
        premises={props.selectedBuildingProperty ? props.selectedBuildingPremises : []}
        companies={props.companies}
        contacts={props.contacts}
        propertyOptions={props.propertyOptions}
        mode={buildingDrawerMode}
        onClose={closeBuildingDrawer}
        onModeChange={setBuildingDrawerMode}
        returnTo={
          props.selectedBuildingProperty
            ? buildingDrawerHref(props.selectedBuildingProperty.property_id)
            : undefined
        }
      />
    </>
  );
}
