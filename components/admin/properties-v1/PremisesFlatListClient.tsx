"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePremisesV1Action } from "@/app/admin/properties/actions";
import {
  PremisesDrawer,
  type PremisesDrawerMode,
} from "@/components/admin/properties-v1/PremisesDrawer";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { usePremisesListSelection } from "@/components/admin/properties-v1/PremisesListSelectionContext";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { formatAreaSqft } from "@/lib/formatCurrency";
import { formatPremisesName, formatVerifiedDate } from "@/lib/premisesDisplay";
import { getPremisesRowPriceDisplay } from "@/lib/premisesCommercial";
import {
  formatListingStatus,
  getPremisesListPriceHeaderLabels,
  isListingIntentForSale,
} from "@/lib/premisesListing";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesFlatFilters, PremisesListItem } from "@/lib/repos/premisesV1";
import { premisesDrawerHref, buildPremisesReturnTo } from "@/lib/premisesDrawerNav";
import { getPremisesTab } from "@/lib/premisesDetailTab";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import { MobileCard, MobileCardList, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";
import { useIsMobile } from "@/lib/useIsMobile";

type SortKey =
  | "premises"
  | "district"
  | "operator"
  | "desks"
  | "gross_area"
  | "price"
  | "psf"
  | "listing_status"
  | "updated";

type SortDir = "asc" | "desc";

const colFilterClass =
  "mt-1 w-full min-w-[5rem] rounded border border-slate-200 px-1.5 py-1 text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#60A5FA] focus:outline-none focus:ring-1 focus:ring-[#EFF6FF]";

function fuzzyMatch(value: string | null | undefined, query: string): boolean {
  if (!query) return true;
  return (value ?? "").toLowerCase().includes(query);
}

function parseNum(value: string | null | undefined): number | null {
  if (value == null || String(value).trim() === "") return null;
  const n = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function compareNullableNum(a: number | null, b: number | null, dir: SortDir): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return dir === "asc" ? a - b : b - a;
}

function rowPriceSortValue(row: PremisesListItem): number | null {
  if (isListingIntentForSale(row.inventory_status)) return parseNum(row.asking_sale_price);
  return parseNum(row.monthly_rent);
}

function rowPsfSortValue(row: PremisesListItem): number | null {
  if (isListingIntentForSale(row.inventory_status)) return parseNum(row.sale_price_psf);
  return parseNum(row.rent_psf);
}

function compareText(a: string, b: string, dir: SortDir): number {
  const cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
  return dir === "asc" ? cmp : -cmp;
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  sortDir,
  onSort,
  filterValue,
  onFilterChange,
  filterPlaceholder,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className="px-3 py-1.5 align-top font-medium">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 text-left hover:text-slate-900"
      >
        <span>{label}</span>
        {active ? <span className="text-slate-500">{sortDir === "asc" ? "↑" : "↓"}</span> : null}
      </button>
      {onFilterChange ? (
        <input
          type="search"
          value={filterValue ?? ""}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder={filterPlaceholder}
          aria-label={`Filter ${label}`}
          className={colFilterClass}
          onClick={(e) => e.stopPropagation()}
        />
      ) : null}
    </th>
  );
}

export function PremisesFlatListClient({
  rows,
  totalCount,
  initialFilters,
  companies,
  contacts,
  propertyOptions,
  drawerData,
}: {
  rows: PremisesListItem[];
  totalCount: number;
  initialFilters: PremisesFlatFilters;
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
  drawerData: PremisesDrawerData | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { selected, toggleOne, toggleAll, selectedCount } = usePremisesListSelection();
  const openId = searchParams.get("premises")?.trim() ?? null;
  const drawerMode: PremisesDrawerMode =
    searchParams.get("mode") === "edit" && !isMobile ? "edit" : "view";
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [colFilters, setColFilters] = useState({ premises: "", district: "", operator: "" });

  const priceHeaders = useMemo(
    () => getPremisesListPriceHeaderLabels(initialFilters),
    [initialFilters],
  );
  const externalReturnTo = searchParams.get("return_to")?.trim();
  const returnTo = useMemo(
    () => externalReturnTo || buildPremisesReturnTo(searchParams),
    [searchParams, externalReturnTo],
  );
  const activeTab = getPremisesTab({ tab: searchParams.get("tab") });

  const openPremises = useMemo(
    () => rows.find((r) => r.premises_id === openId) ?? null,
    [openId, rows],
  );

  const displayedRows = useMemo(() => {
    const premisesQ = colFilters.premises.trim().toLowerCase();
    const districtQ = colFilters.district.trim().toLowerCase();
    const operatorQ = colFilters.operator.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      const premisesName = formatPremisesName(row.building_name_en, row.floor, row.unit);
      if (!fuzzyMatch(premisesName, premisesQ)) return false;
      if (!fuzzyMatch(row.district_en, districtQ)) return false;
      if (!fuzzyMatch(row.operator_name, operatorQ)) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "premises": {
          const av = formatPremisesName(a.building_name_en, a.floor, a.unit);
          const bv = formatPremisesName(b.building_name_en, b.floor, b.unit);
          return compareText(av, bv, sortDir);
        }
        case "district":
          return compareText(a.district_en ?? "", b.district_en ?? "", sortDir);
        case "operator":
          return compareText(a.operator_name ?? "", b.operator_name ?? "", sortDir);
        case "desks":
          return compareNullableNum(parseNum(a.workstation_count), parseNum(b.workstation_count), sortDir);
        case "gross_area":
          return compareNullableNum(parseNum(a.gross_area_sqft), parseNum(b.gross_area_sqft), sortDir);
        case "price":
          return compareNullableNum(rowPriceSortValue(a), rowPriceSortValue(b), sortDir);
        case "psf":
          return compareNullableNum(rowPsfSortValue(a), rowPsfSortValue(b), sortDir);
        case "listing_status":
          return compareText(formatListingStatus(a.offer_status), formatListingStatus(b.offer_status), sortDir);
        case "updated":
          return compareText(a.last_verified_date ?? "", b.last_verified_date ?? "", sortDir);
        default:
          return 0;
      }
    });

    return sorted;
  }, [rows, colFilters, sortKey, sortDir]);

  const displayedIds = useMemo(() => displayedRows.map((r) => r.premises_id), [displayedRows]);
  useSyncListingExportIds(displayedIds);
  const allSelected = displayedRows.length > 0 && displayedIds.every((id) => selected.has(id));

  function handleToggleAll() {
    toggleAll(displayedIds, !allSelected);
  }

  function toggleOneRow(id: string) {
    toggleOne(id);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "updated" ? "desc" : "asc");
    }
  }

  function navigate(premisesId: string, mode: PremisesDrawerMode) {
    router.replace(
      premisesDrawerHref(searchParams, premisesId, activeTab, mode === "edit" ? "edit" : "view"),
    );
  }

  function openView(premisesId: string) {
    router.replace(premisesDrawerHref(searchParams, premisesId, "overview", "view"));
  }

  function openEdit(premisesId: string) {
    router.replace(premisesDrawerHref(searchParams, premisesId, activeTab, "edit"));
  }

  function closeDrawer() {
    router.replace(returnTo);
  }

  function setMode(mode: PremisesDrawerMode) {
    if (!openId) return;
    navigate(openId, mode);
  }

  const colSpan = 11;
  const theme = moduleAccentClasses("properties");

  return (
    <>
      <ListingRecordCount
        filteredCount={displayedRows.length}
        totalCount={totalCount}
        label="Premises"
        selectedCount={selectedCount}
      />
      <MobileCardList>
        {displayedRows.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-500">
            {rows.length === 0 ? "No premises yet." : "No premises match your filters."}
          </p>
        ) : (
          displayedRows.map((row) => {
            const prices = getPremisesRowPriceDisplay(row);
            const name = formatPremisesName(row.building_name_en, row.floor, row.unit);
            return (
              <MobileCard key={row.premises_id} onClick={() => openView(row.premises_id)}>
                <MobileCardTitle>{name}</MobileCardTitle>
                <MobileCardMeta>
                  {row.district_en ?? "—"} · {row.operator_name ?? "No operator"}
                </MobileCardMeta>
                <MobileCardMeta>
                  {formatAreaSqft(row.gross_area_sqft)} · {prices.price} · {formatListingStatus(row.offer_status)}
                </MobileCardMeta>
              </MobileCard>
            );
          })
        )}
      </MobileCardList>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-10 px-3 py-1.5 align-top">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  aria-label="Select all premises"
                  className="rounded border-slate-300"
                />
              </th>
              <SortableHeader
                label="Premises"
                sortKey="premises"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                filterValue={colFilters.premises}
                onFilterChange={(v) => setColFilters((f) => ({ ...f, premises: v }))}
                filterPlaceholder="Filter…"
              />
              <SortableHeader
                label="District"
                sortKey="district"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                filterValue={colFilters.district}
                onFilterChange={(v) => setColFilters((f) => ({ ...f, district: v }))}
                filterPlaceholder="Filter…"
              />
              <SortableHeader
                label="Operator"
                sortKey="operator"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                filterValue={colFilters.operator}
                onFilterChange={(v) => setColFilters((f) => ({ ...f, operator: v }))}
                filterPlaceholder="Filter…"
              />
              <SortableHeader
                label="Desks"
                sortKey="desks"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Gross area"
                sortKey="gross_area"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label={priceHeaders.price}
                sortKey="price"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label={priceHeaders.psf}
                sortKey="psf"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Listing Status"
                sortKey="listing_status"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Updated"
                sortKey="updated"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th className="w-24 px-3 py-1.5 align-top font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  No premises match your filters.
                </td>
              </tr>
            ) : displayedRows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-slate-500">
                  No premises match your column filters.
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => {
                const prices = getPremisesRowPriceDisplay(row);
                return (
                  <tr key={row.premises_id} className="border-t border-slate-100">
                    <td className="px-3 py-1.5">
                      <input
                        type="checkbox"
                        checked={selected.has(row.premises_id)}
                        onChange={() => toggleOneRow(row.premises_id)}
                        aria-label={`Select ${formatPremisesName(row.building_name_en, row.floor, row.unit)}`}
                        className="rounded border-slate-300"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        type="button"
                        className={`text-left ${theme.link}`}
                        onClick={() => openView(row.premises_id)}
                      >
                        {formatPremisesName(row.building_name_en, row.floor, row.unit)}
                      </button>
                    </td>
                    <td className="px-3 py-1.5 text-slate-700">{row.district_en ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-700">{row.operator_name ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-700">{row.workstation_count ?? "—"}</td>
                    <td className="px-3 py-1.5 text-slate-700">{formatAreaSqft(row.gross_area_sqft)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{prices.price}</td>
                    <td className="px-3 py-1.5 text-slate-700">{prices.psf}</td>
                    <td className="px-3 py-1.5 text-slate-700">{formatListingStatus(row.offer_status)}</td>
                    <td className="px-3 py-1.5 text-slate-700">{formatVerifiedDate(row.last_verified_date)}</td>
                    <td className="px-3 py-1.5">
                      <ModuleRowActions
                        module="properties"
                        onView={() => openView(row.premises_id)}
                        onEdit={() => openEdit(row.premises_id)}
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
        premises={openPremises}
        propertyId={openPremises?.property_id ?? ""}
        buildingName={openPremises?.building_name_en ?? null}
        mode={drawerMode}
        onClose={closeDrawer}
        onModeChange={setMode}
        action={updatePremisesV1Action}
        companies={companies}
        contacts={contacts}
        propertyOptions={propertyOptions}
        drawerData={drawerData}
        returnTo={
          openPremises
            ? premisesDrawerHref(searchParams, openPremises.premises_id, activeTab, "view")
            : undefined
        }
      />
    </>
  );
}
