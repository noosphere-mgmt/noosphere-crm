"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import {
  PremisesDrawer,
  type PremisesDrawerMode,
} from "@/components/admin/properties-v1/PremisesDrawer";
import { formatPremisesCompactLabel } from "@/lib/premisesDisplay";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { getPremisesRowPriceDisplay } from "@/lib/premisesCommercial";
import { normalizeListingIntent } from "@/lib/premisesListing";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import { getPremisesTab } from "@/lib/premisesDetailTab";
import { buildPremisesReturnTo, premisesDrawerHref } from "@/lib/premisesDrawerNav";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import { asArray } from "@/lib/asArray";
import { normalizePremisesDrawerData, normalizePremisesV1Client } from "@/lib/premisesClientData";
import {
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_OPERATING_MODELS,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";

const selectClass =
  "rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 focus:border-[#60A5FA] focus:outline-none focus:ring-2 focus:ring-[#EFF6FF]";

type BuildingPremisesFilters = {
  listing_intent: string;
  listing_status: string;
  operating_model: string;
  fit_out_condition: string;
  view_type: string;
};

const EMPTY_FILTERS: BuildingPremisesFilters = {
  listing_intent: "",
  listing_status: "",
  operating_model: "",
  fit_out_condition: "",
  view_type: "",
};

function chip(v: string | null | undefined): string {
  const s = (v ?? "").trim();
  return s || "—";
}

function matchesBuildingPremisesFilters(p: PremisesV1, filters: BuildingPremisesFilters): boolean {
  if (filters.listing_intent && normalizeListingIntent(p.inventory_status) !== filters.listing_intent) {
    return false;
  }
  if (filters.listing_status && (p.offer_status ?? "").trim() !== filters.listing_status) {
    return false;
  }
  if (filters.operating_model && (p.operating_model ?? "").trim() !== filters.operating_model) {
    return false;
  }
  if (filters.fit_out_condition && (p.fit_out_condition ?? "").trim() !== filters.fit_out_condition) {
    return false;
  }
  if (filters.view_type && (p.view_type ?? "").trim() !== filters.view_type) {
    return false;
  }
  return true;
}

export function PropertiesV1Client({
  propertyId,
  buildingName,
  premises,
  companies,
  contacts,
  propertyOptions,
  drawerData,
}: {
  propertyId: string;
  buildingName: string | null;
  premises: PremisesV1[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
  drawerData: PremisesDrawerData | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<BuildingPremisesFilters>(EMPTY_FILTERS);

  const drawerBasePath = `/admin/properties/${propertyId}`;
  const openId = searchParams.get("premises")?.trim() ?? null;
  const drawerMode: PremisesDrawerMode = searchParams.get("mode") === "edit" ? "edit" : "view";
  const activeTab = getPremisesTab({ tab: searchParams.get("tab") });
  const returnTo = useMemo(() => buildPremisesReturnTo(searchParams, drawerBasePath), [searchParams, drawerBasePath]);

  const normalizedPremises = useMemo(
    () => asArray<PremisesV1>(premises).map((p) => normalizePremisesV1Client(p)),
    [premises],
  );

  const selected = useMemo(() => {
    if (!openId) return null;
    return normalizedPremises.find((p) => p.premises_id === openId || p.business_id === openId) ?? null;
  }, [openId, normalizedPremises]);

  const filteredPremises = useMemo(
    () => normalizedPremises.filter((p) => matchesBuildingPremisesFilters(p, filters)),
    [normalizedPremises, filters],
  );

  const hasActiveFilters = Object.values(filters).some(Boolean);
  const theme = moduleAccentClasses("properties");

  function patchFilters(partial: Partial<BuildingPremisesFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  function navigate(premisesId: string, mode: PremisesDrawerMode) {
    router.replace(
      premisesDrawerHref(searchParams, premisesId, activeTab, mode === "edit" ? "edit" : "view", drawerBasePath),
    );
  }

  function openView(premisesId: string) {
    router.replace(premisesDrawerHref(searchParams, premisesId, "overview", "view", drawerBasePath));
  }

  function openEdit(premisesId: string) {
    router.replace(premisesDrawerHref(searchParams, premisesId, activeTab, "edit", drawerBasePath));
  }

  function closeDrawer() {
    router.replace(returnTo);
  }

  function setMode(mode: PremisesDrawerMode) {
    if (!openId) return;
    navigate(openId, mode);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Premises</h2>
          <p className="mt-1 text-sm text-slate-600">
            Click a premises to review details. Use Edit when you need to make changes.
          </p>
        </div>
        <Link
          href={`/admin/properties/premises/new?property_id=${encodeURIComponent(propertyId)}`}
          className={theme.primaryButton}
        >
          + Add premises
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <select
          aria-label="Listing Intent"
          value={filters.listing_intent}
          onChange={(e) => patchFilters({ listing_intent: e.target.value })}
          className={selectClass}
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
          value={filters.listing_status}
          onChange={(e) => patchFilters({ listing_status: e.target.value })}
          className={selectClass}
        >
          <option value="">Listing Status</option>
          {V1_LISTING_STATUSES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          aria-label="Operating Model"
          value={filters.operating_model}
          onChange={(e) => patchFilters({ operating_model: e.target.value })}
          className={selectClass}
        >
          <option value="">Operating Model</option>
          {V1_OPERATING_MODELS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          aria-label="Fit Out"
          value={filters.fit_out_condition}
          onChange={(e) => patchFilters({ fit_out_condition: e.target.value })}
          className={selectClass}
        >
          <option value="">Fit Out</option>
          {V1_FIT_OUT_CONDITIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          aria-label="View"
          value={filters.view_type}
          onChange={(e) => patchFilters({ view_type: e.target.value })}
          className={selectClass}
        >
          <option value="">View</option>
          {V1_VIEW_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          className="ml-auto rounded-md border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-default disabled:opacity-40"
        >
          Reset
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-1.5 font-medium">Premises</th>
              <th className="px-3 py-1.5 font-medium">Desks</th>
              <th className="px-3 py-1.5 font-medium">Gross area</th>
              <th className="px-3 py-1.5 font-medium">Rent / Sales Price</th>
              <th className="px-3 py-1.5 font-medium">Fit Out</th>
              <th className="px-3 py-1.5 font-medium">View</th>
              <th className="w-16 px-3 py-1.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {normalizedPremises.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No premises lines yet.
                </td>
              </tr>
            ) : filteredPremises.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No premises match your filters.
                </td>
              </tr>
            ) : (
              filteredPremises.map((p) => {
                const { price } = getPremisesRowPriceDisplay(p);
                return (
                  <tr key={p.premises_id} className="border-t border-slate-100">
                    <td className="px-3 py-1.5">
                      <button
                        type="button"
                        className={`text-left ${theme.link}`}
                        onClick={() => openView(p.premises_id)}
                      >
                        {formatPremisesCompactLabel(p.floor, p.unit)}
                      </button>
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{chip(p.workstation_count)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{formatAreaSqft(p.gross_area_sqft)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{price}</td>
                    <td className="px-3 py-1.5 text-slate-700">{chip(p.fit_out_condition)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{chip(p.view_type)}</td>
                    <td className="px-3 py-1.5">
                      <ModuleRowActions
                        module="properties"
                        onView={() => openView(p.premises_id)}
                        onEdit={() => openEdit(p.premises_id)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <PremisesDrawer
        premises={selected}
        propertyId={propertyId}
        buildingName={buildingName}
        mode={drawerMode}
        onClose={closeDrawer}
        onModeChange={setMode}
        action={updatePremisesV1Action}
        companies={companies}
        contacts={contacts}
        propertyOptions={propertyOptions}
        drawerData={normalizePremisesDrawerData(drawerData)}
        drawerBasePath={drawerBasePath}
        returnTo={
          selected
            ? premisesDrawerHref(searchParams, selected.premises_id, activeTab, "view", drawerBasePath)
            : undefined
        }
      />
    </section>
  );
}
