"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PropertyDrawer,
  type PropertyDrawerMode,
} from "@/components/admin/properties-v1/PropertyDrawer";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import { formatBuildingGradeShort } from "@/lib/buildingGradeDisplay";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { MobileCard, MobileCardList, MobileCardMeta, MobileCardTitle } from "@/components/admin/mobile/MobileCard";

export type BuildingLookupRow = Pick<
  PropertyV1,
  "property_id" | "bldg_name_en" | "district_en" | "inventory_count"
> & {
  city_en?: string | null;
  grade?: string | null;
};

function buildReturnTo(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("property");
  params.delete("mode");
  const qs = params.toString();
  return qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings";
}

function BuildingRow({
  row,
  onOpen,
}: {
  row: BuildingLookupRow;
  onOpen: (propertyId: string) => void;
}) {
  const name = row.bldg_name_en?.trim() || "Unnamed building";
  const district = row.district_en?.trim() || row.city_en?.trim() || "—";
  const grade = formatBuildingGradeShort(row.grade);
  const count = row.inventory_count ?? 0;
  const metaParts = [
    district,
    grade !== "—" ? grade : null,
    `${count} premise${count === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <MobileCard onClick={() => onOpen(row.property_id)}>
      <MobileCardTitle>{name}</MobileCardTitle>
      <RecordBusinessId id={row.property_id} className="mt-0.5 block" />
      <MobileCardMeta>{metaParts.join(" · ")}</MobileCardMeta>
    </MobileCard>
  );
}

export function BuildingsLookupList({
  rows,
  totalCount,
  hasSearch,
  selectedProperty,
  selectedPremises,
  companies,
  contacts,
  propertyOptions,
}: {
  rows: BuildingLookupRow[];
  totalCount: number;
  hasSearch: boolean;
  selectedProperty: PropertyV1 | null;
  selectedPremises: PremisesV1[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerMode, setDrawerMode] = useState<PropertyDrawerMode>("view");

  const openId = searchParams.get("property")?.trim() ?? null;
  const returnTo = useMemo(() => buildReturnTo(searchParams), [searchParams]);

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    setDrawerMode(modeParam === "edit" ? "edit" : "view");
  }, [searchParams]);

  const openProperty = useMemo(() => {
    if (!openId || !selectedProperty || selectedProperty.property_id !== openId) return null;
    return selectedProperty;
  }, [openId, selectedProperty]);

  function navigate(propertyId: string, mode: PropertyDrawerMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("property", propertyId);
    params.set("mode", mode);
    router.replace(`/admin/properties/buildings?${params.toString()}`);
  }

  function openView(propertyId: string) {
    navigate(propertyId, "view");
  }

  function closeDrawer() {
    router.replace(returnTo);
  }

  function setMode(mode: PropertyDrawerMode) {
    if (!openId) return;
    navigate(openId, mode);
  }

  const emptyMessage = hasSearch ? "No buildings match your search." : "No buildings yet.";

  return (
    <>
      <ListingRecordCount
        filteredCount={rows.length}
        totalCount={totalCount}
        label="Buildings"
      />

      <MobileCardList>
        {rows.length === 0 ? (
          <p className="px-1 py-6 text-center text-sm text-slate-500">{emptyMessage}</p>
        ) : (
          rows.map((row) => (
            <BuildingRow key={row.property_id} row={row} onOpen={openView} />
          ))
        )}
      </MobileCardList>

      <PropertyDrawer
        property={openProperty}
        premises={openProperty ? selectedPremises : []}
        companies={companies}
        contacts={contacts}
        propertyOptions={propertyOptions}
        mode={drawerMode}
        onClose={closeDrawer}
        onModeChange={setMode}
        returnTo={
          openProperty
            ? `${returnTo}${returnTo.includes("?") ? "&" : "?"}property=${encodeURIComponent(openProperty.property_id)}&mode=view`
            : undefined
        }
      />
    </>
  );
}
