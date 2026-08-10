"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PremisesFiltersBarDesktop } from "@/components/admin/properties-v1/PremisesFiltersBarDesktop";
import { PremisesListDesktop } from "@/components/admin/properties-v1/PremisesListDesktop";
import { PremisesListHeaderDesktop } from "@/components/admin/properties-v1/PremisesListHeaderDesktop";
import { PropertyDrawer, type PropertyDrawerMode } from "@/components/admin/properties-v1/PropertyDrawer";
import { buildingFullPageHref } from "@/lib/crmDetailNav";
import type { PremisesViewProps } from "@/components/admin/properties-v1/PremisesDesktop";

export function PropertiesSplitDesktop(props: PremisesViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [buildingId, setBuildingId] = useState<string | null>(null);
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

  const visibleBuildings = useMemo(() => {
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

      const buildingMatches = [building.label, building.city, building.district, building.country]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
      return buildingMatches || matchingBuildingIds.has(building.property_id);
    });
  }, [props.filters, props.propertyOptions, props.rows]);

  const selectedBuilding = props.propertyOptions.find((building) => building.property_id === buildingId) ?? null;
  const premisesRows = buildingId ? props.rows.filter((row) => row.property_id === buildingId) : props.rows;

  return (
    <>
      <PremisesListHeaderDesktop showCreate={false} />
      <PremisesFiltersBarDesktop filters={props.filters} cities={props.cities} districts={props.districts} />

      <div className="mt-4 grid min-h-[65vh] grid-cols-[18rem_minmax(0,1fr)] gap-4">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">Buildings</h2>
                <p className="text-xs text-slate-500">{props.propertyOptions.length} records</p>
              </div>
              <Link href="/admin/properties/buildings/new" className="rounded-lg bg-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-800">
                + Building
              </Link>
            </div>
          </div>

          <div className="max-h-[calc(100vh-17rem)] overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => setBuildingId(null)}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${buildingId === null ? "bg-sky-50 font-semibold text-sky-900 ring-1 ring-sky-100" : "text-slate-700 hover:bg-slate-50"}`}
            >
              <span>All buildings</span>
              <span className="text-xs tabular-nums text-slate-500">{props.rows.length}</span>
            </button>
            {visibleBuildings.map((building) => (
              <div
                key={building.property_id}
                className={`group mb-1 flex items-start gap-1 rounded-lg pr-1 ${buildingId === building.property_id ? "bg-sky-50 text-sky-900 ring-1 ring-sky-100" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <div className="min-w-0 flex-1 px-3 py-2.5 text-left text-sm">
                  <Link
                    href={buildingDrawerHref(building.property_id)}
                    scroll={false}
                    className={`line-clamp-2 font-medium text-sky-800 underline-offset-2 hover:underline ${buildingId === building.property_id ? "font-semibold" : ""}`}
                  >
                    {building.label}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setBuildingId(building.property_id)}
                    className="mt-1 block text-left text-[11px] text-slate-500 hover:text-sky-800"
                    title="Show this building's premises"
                  >
                    {premisesCountByBuilding.get(building.property_id) ?? 0} premises · {listingCountsByBuilding.get(building.property_id)?.lease ?? 0} lease · {listingCountsByBuilding.get(building.property_id)?.sale ?? 0} sale
                  </button>
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
            ))}
            {visibleBuildings.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">No buildings match the current filters.</p>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Premises workspace</p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{selectedBuilding?.label ?? "All premises"}</h2>
              <p className="text-xs text-slate-500">{premisesRows.length} premises shown</p>
            </div>
            <div className="flex gap-2">
              {selectedBuilding ? (
                <Link href={buildingFullPageHref(selectedBuilding.business_id ?? selectedBuilding.property_id) ?? "/admin/properties/buildings"} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Open building
                </Link>
              ) : null}
              <Link
                href={selectedBuilding ? `/admin/properties/premises/new?property_id=${encodeURIComponent(selectedBuilding.property_id)}` : "/admin/properties/premises/new"}
                className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800"
              >
                + Premises
              </Link>
            </div>
          </div>

          <PremisesListDesktop
            {...props}
            rows={premisesRows}
            totalCount={buildingId ? premisesRows.length : props.totalCount}
          />
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
        returnTo={props.selectedBuildingProperty ? buildingDrawerHref(props.selectedBuildingProperty.property_id) : undefined}
      />
    </>
  );
}
