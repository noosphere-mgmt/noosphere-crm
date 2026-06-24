"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PropertyDrawer,
  type PropertyDrawerMode,
} from "@/components/admin/properties-v1/PropertyDrawer";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { ModuleRowActions } from "@/components/admin/ModuleRowActions";
import { RecordNameWithId } from "@/components/admin/RecordBusinessId";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { usePropertiesListSelection } from "@/components/admin/properties-v1/PropertiesListSelectionContext";
import { formatPropertyV1AddressEn } from "@/lib/composeAddress";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";

export type PropertyListRow = Pick<
  PropertyV1,
  | "property_id"
  | "business_id"
  | "bldg_name_en"
  | "district_en"
  | "title"
  | "street_no"
  | "street_name_en"
  | "city_en"
  | "full_address_en"
  | "inventory_count"
  | "updated_at"
>;

function buildReturnTo(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("property");
  params.delete("mode");
  const qs = params.toString();
  return qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings";
}

export function PropertiesFlatListClient({
  rows,
  totalCount,
  hasSearch,
  selectedProperty,
  selectedPremises,
  companies,
  contacts,
  propertyOptions,
}: {
  rows: PropertyListRow[];
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
  const { selected, toggleOne, toggleAll, selectedCount } = usePropertiesListSelection();
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

  function openEdit(propertyId: string) {
    navigate(propertyId, "edit");
  }

  function closeDrawer() {
    router.replace(returnTo);
  }

  function setMode(mode: PropertyDrawerMode) {
    if (!openId) return;
    navigate(openId, mode);
  }

  const emptyMessage = hasSearch ? "No properties match your search." : "No properties yet.";
  const theme = moduleAccentClasses("properties");
  const displayedIds = useMemo(() => rows.map((r) => r.property_id), [rows]);
  const allSelected = rows.length > 0 && displayedIds.every((id) => selected.has(id));

  function handleToggleAll() {
    toggleAll(displayedIds, !allSelected);
  }

  return (
    <>
      <ListingRecordCount
        filteredCount={rows.length}
        totalCount={totalCount}
        label="Buildings"
        selectedCount={selectedCount}
      />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-10 px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleToggleAll}
                  aria-label="Select all buildings"
                  className="rounded border-slate-300"
                />
              </th>
              <th className="px-3 py-1.5 font-medium">Building</th>
              <th className="px-3 py-1.5 font-medium">District</th>
              <th className="px-3 py-1.5 font-medium">Title</th>
              <th className="px-3 py-1.5 font-medium">Address</th>
              <th className="px-3 py-1.5 font-medium">Premises</th>
              <th className="px-3 py-1.5 font-medium">Updated</th>
              <th className="w-24 px-3 py-1.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.property_id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">
                    <input
                      type="checkbox"
                      checked={selected.has(row.property_id)}
                      onChange={() => toggleOne(row.property_id)}
                      aria-label={`Select ${row.bldg_name_en ?? row.property_id}`}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <button
                      type="button"
                      className={`text-left ${theme.link}`}
                      onClick={() => openView(row.property_id)}
                    >
                      <RecordNameWithId
                        name={row.bldg_name_en ?? "—"}
                        id={row.business_id ?? row.property_id}
                        nameClassName={theme.link}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">{row.district_en ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{row.title ?? "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{formatPropertyV1AddressEn(row) || "—"}</td>
                  <td className="px-3 py-1.5 text-slate-700">{row.inventory_count ?? 0}</td>
                  <td className="px-3 py-1.5 text-slate-700">{row.updated_at?.slice(0, 10) ?? "—"}</td>
                  <td className="px-3 py-1.5">
                    <ModuleRowActions
                      module="properties"
                      onView={() => openView(row.property_id)}
                      onEdit={() => openEdit(row.property_id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
