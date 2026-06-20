"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PremisesDrawerMode } from "@/components/admin/properties-v1/PremisesDrawer";
import { usePremisesListSelection } from "@/components/admin/properties-v1/PremisesListSelectionContext";
import { useSyncListingExportIds } from "@/components/admin/ModuleListingExportContext";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { formatPremisesName } from "@/lib/premisesDisplay";
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
import { getPremisesRowPriceDisplay } from "@/lib/premisesCommercial";

export type SortKey =
  | "premises"
  | "district"
  | "operator"
  | "desks"
  | "gross_area"
  | "price"
  | "psf"
  | "listing_status"
  | "updated";

export type SortDir = "asc" | "desc";

export type PremisesColFilters = {
  premises: string;
  district: string;
  operator: string;
};

export type PremisesFlatListHookProps = {
  rows: PremisesListItem[];
  totalCount: number;
  initialFilters: PremisesFlatFilters;
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
  drawerData: PremisesDrawerData | null;
};

export type PremisesListComponentProps = Omit<PremisesFlatListHookProps, "initialFilters"> & {
  initialFilters?: PremisesFlatFilters;
  filters?: PremisesFlatFilters;
  cities?: string[];
  districts?: string[];
};

export function buildingDetailsHref(propertyId: string): string {
  return `/admin/properties/buildings?property=${encodeURIComponent(propertyId)}&mode=view`;
}

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

export function usePremisesFlatList(
  props: PremisesFlatListHookProps,
  options: { drawerViewport: "mobile" | "desktop" },
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selected, toggleOne, toggleAll, selectedCount } = usePremisesListSelection();
  const openId = searchParams.get("premises")?.trim() ?? null;
  const drawerMode: PremisesDrawerMode =
    options.drawerViewport === "mobile"
      ? "view"
      : searchParams.get("mode") === "edit"
        ? "edit"
        : "view";
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [colFilters, setColFilters] = useState<PremisesColFilters>({
    premises: "",
    district: "",
    operator: "",
  });

  const priceHeaders = useMemo(
    () => getPremisesListPriceHeaderLabels(props.initialFilters),
    [props.initialFilters],
  );
  const externalReturnTo = searchParams.get("return_to")?.trim();
  const returnTo = useMemo(
    () => externalReturnTo || buildPremisesReturnTo(searchParams),
    [searchParams, externalReturnTo],
  );
  const activeTab = getPremisesTab({ tab: searchParams.get("tab") });

  const openPremises = useMemo(
    () => props.rows.find((r) => r.premises_id === openId) ?? null,
    [openId, props.rows],
  );

  const displayedRows = useMemo(() => {
    const premisesQ = colFilters.premises.trim().toLowerCase();
    const districtQ = colFilters.district.trim().toLowerCase();
    const operatorQ = colFilters.operator.trim().toLowerCase();

    const filtered = props.rows.filter((row) => {
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
  }, [props.rows, colFilters, sortKey, sortDir]);

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

  const theme = moduleAccentClasses("properties");
  const colSpan = 11;

  return {
    ...props,
    searchParams,
    activeTab,
    openId,
    drawerMode,
    sortKey,
    sortDir,
    colFilters,
    setColFilters,
    priceHeaders,
    openPremises,
    displayedRows,
    displayedIds,
    selected,
    selectedCount,
    allSelected,
    handleToggleAll,
    toggleOneRow,
    handleSort,
    openView,
    openEdit,
    closeDrawer,
    setMode,
    theme,
    colSpan,
    getPremisesRowPriceDisplay,
  };
}

export function resolvePremisesFlatListFilters(props: PremisesListComponentProps): PremisesFlatFilters {
  return props.initialFilters ?? props.filters!;
}
