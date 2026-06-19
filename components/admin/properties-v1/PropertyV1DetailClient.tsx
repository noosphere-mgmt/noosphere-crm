"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import { composeAddressChinese, composeAddressEnglish } from "@/lib/composeAddress";
import { BUILDING_GRADES, BUILDING_TITLES } from "@/lib/lookups";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import { toCompanyV1SelectOptions } from "@/lib/companyV1Display";
import { CompanyConnectionFields } from "@/components/admin/CompanyConnectionFields";
import { FormField, SelectField, TextAreaField } from "@/components/admin/AdminFormFields";
import { FormEditingContext, ModuleActionBar } from "@/components/admin/ModuleActionBar";
import { PropertiesV1Client } from "@/app/admin/properties/[id]/PropertiesV1Client";
import { createPropertyV1Action, updatePropertyV1Action } from "@/app/admin/properties/actions";

type TabKey = "property" | "premises";

function propertyTitle(property: PropertyV1): string {
  if (!property.property_id) return "New building";
  return property.bldg_name_en?.trim() || property.property_id;
}

function readFormAddress(form: HTMLFormElement) {
  const value = (name: string) =>
    String((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "").trim();

  const enParts = {
    streetNo: value("street_no"),
    streetName: value("street_name_en"),
    district: value("district_en"),
    city: value("city_en"),
  };
  const zhParts = {
    streetNo: value("street_no"),
    streetName: value("street_name_zh"),
    district: value("district_zh"),
    city: value("city_zh"),
  };
  const cnParts = {
    streetNo: value("street_no"),
    streetName: value("street_name_cn"),
    district: value("district_cn"),
    city: value("city_cn"),
  };

  return {
    en: composeAddressEnglish(enParts),
    zh: composeAddressChinese(zhParts),
    cn: composeAddressChinese(cnParts),
  };
}

function syncHiddenAddresses(form: HTMLFormElement) {
  const addresses = readFormAddress(form);
  const setHidden = (name: string, v: string) => {
    const el = form.elements.namedItem(name) as HTMLInputElement | null;
    if (el) el.value = v;
  };
  setHidden("full_address_en", addresses.en);
  setHidden("full_address_zh", addresses.zh);
  setHidden("full_address_cn", addresses.cn);
  return addresses;
}

function initialAddresses(property: PropertyV1) {
  const enParts = {
    streetNo: property.street_no,
    streetName: property.street_name_en,
    district: property.district_en,
    city: property.city_en,
  };
  const zhParts = {
    streetNo: property.street_no,
    streetName: property.street_name_zh,
    district: property.district_zh,
    city: property.city_zh,
  };

  return {
    en: property.full_address_en?.trim() || composeAddressEnglish(enParts),
    zh: property.full_address_zh?.trim() || composeAddressChinese(zhParts),
  };
}

export function PropertyV1DetailClient({
  property,
  premises,
  companies,
  contacts,
  premisesDrawerData = null,
  propertyOptions = [],
  embedded = false,
  editMode: editModeProp,
  onEditModeChange,
  returnTo,
}: {
  property: PropertyV1;
  premises: PremisesV1[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  premisesDrawerData?: PremisesDrawerData | null;
  propertyOptions?: PropertyV1SelectOption[];
  embedded?: boolean;
  editMode?: boolean;
  onEditModeChange?: (edit: boolean) => void;
  returnTo?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>("property");
  const isNew = !property.property_id;
  const [internalEditMode, setInternalEditMode] = useState(isNew);
  const [addresses, setAddresses] = useState(() => initialAddresses(property));
  const updatePropertyAction = useMemo(
    () =>
      isNew ? createPropertyV1Action : updatePropertyV1Action.bind(null, property.property_id),
    [isNew, property.property_id],
  );

  const controlled = onEditModeChange != null;
  const editMode = controlled ? Boolean(editModeProp) : internalEditMode;
  const setEditMode = controlled
    ? (next: boolean) => onEditModeChange!(next)
    : setInternalEditMode;

  useEffect(() => {
    if (searchParams.get("premises")?.trim()) {
      setTab("premises");
    }
  }, [searchParams]);

  const locationSummary = useMemo(() => {
    if (addresses.en) return addresses.en;
    if (addresses.zh) return addresses.zh;
    return "No address entered";
  }, [addresses]);

  const syncAddresses = useCallback(() => {
    if (!formRef.current) return;
    const next = syncHiddenAddresses(formRef.current);
    setAddresses({ en: next.en, zh: next.zh });
  }, []);

  useEffect(() => {
    syncAddresses();
  }, [syncAddresses]);

  const formId = isNew ? "property-form-new" : `property-form-${property.property_id}`;

  const companyOptions = useMemo(() => toCompanyV1SelectOptions(companies), [companies]);

  return (
    <div className="space-y-4">
      {embedded ? null : (
        <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Properties</p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">{propertyTitle(property)}</h1>
            {addresses.en || addresses.zh ? (
              <div className="mt-1">
                {addresses.en ? <p className="text-sm leading-snug text-slate-600">{addresses.en}</p> : null}
                {addresses.zh ? <p className="text-sm leading-snug text-slate-500">{addresses.zh}</p> : null}
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-400">Address will appear when location fields are filled.</p>
            )}
          </div>
          {tab === "property" ? (
            <ModuleActionBar
              mode={editMode ? "edit" : "view"}
              onEdit={() => setEditMode(true)}
              onCancel={() => {
                if (isNew && returnTo) {
                  router.push(returnTo);
                  return;
                }
                setEditMode(false);
                router.refresh();
              }}
              formId={formId}
            />
          ) : null}
        </header>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("property")}
          className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "property"
              ? "border border-b-white border-slate-200 bg-white text-blue-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          Property details
        </button>
        <button
          type="button"
          onClick={() => setTab("premises")}
          disabled={isNew}
          className={`rounded-t-lg px-4 py-2 text-sm font-semibold transition ${
            tab === "premises"
              ? "border border-b-white border-slate-200 bg-white text-blue-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          } ${isNew ? "cursor-not-allowed opacity-50" : ""}`}
        >
          Premises
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {premises.length}
          </span>
        </button>
      </div>

      {tab === "property" ? (
        <FormEditingContext.Provider value={editMode}>
          <form id={formId} ref={formRef} action={updatePropertyAction} className="w-full" onInput={syncAddresses}>
          {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
          <input type="hidden" name="full_address_en" defaultValue={initialAddresses(property).en} />
          <input type="hidden" name="full_address_zh" defaultValue={initialAddresses(property).zh} />
          <input type="hidden" name="full_address_cn" defaultValue={property.full_address_cn ?? ""} />

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Building</h2>
              <div className="grid gap-4 lg:grid-cols-3">
                <FormField label="Building name (EN)" name="bldg_name_en" defaultValue={property.bldg_name_en ?? ""} />
                <FormField label="Building name (ZH)" name="bldg_name_zh" defaultValue={property.bldg_name_zh ?? ""} />
                <FormField label="Building name (CN)" name="bldg_name_cn" defaultValue={property.bldg_name_cn ?? ""} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Building specification</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Year built"
                  name="year_built"
                  type="number"
                  defaultValue={property.year_built?.toString() ?? ""}
                />
                <FormField
                  label="No. of floors"
                  name="floor_count"
                  type="number"
                  defaultValue={property.floor_count?.toString() ?? ""}
                />
                <FormField
                  label="Building area (sq ft)"
                  name="bldg_area_sqft"
                  type="number"
                  defaultValue={property.bldg_area_sqft ?? ""}
                />
                <FormField
                  label="Building area (sqm)"
                  name="bldg_area_sqm"
                  type="number"
                  defaultValue={property.bldg_area_sqm ?? ""}
                />
                <SelectField
                  label="Grade"
                  name="grade"
                  defaultValue={property.grade ?? ""}
                  options={BUILDING_GRADES}
                />
                <SelectField
                  label="Title"
                  name="title"
                  defaultValue={property.title ?? ""}
                  options={BUILDING_TITLES}
                />
              </div>
              <div className="mt-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Company links</h3>
                <CompanyConnectionFields
                  defaults={property}
                  companyOptions={companyOptions}
                  showManagement={false}
                />
                <SelectField
                  label="Management company"
                  name="management_company_id"
                  defaultValue={property.management_company_id ?? ""}
                  placeholder="— Select company —"
                  options={companyOptions}
                />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <TextAreaField label="Building description" name="bldg_desc" defaultValue={property.bldg_desc ?? ""} />
                <TextAreaField label="Building remarks" name="building_remarks" defaultValue={property.building_remarks ?? ""} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Site</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Lot number" name="lot_number" defaultValue={property.lot_number ?? ""} />
                <FormField label="Land use" name="land_use" defaultValue={property.land_use ?? ""} />
                <FormField label="Class of site" name="class_of_site" defaultValue={property.class_of_site ?? ""} />
                <FormField label="Land tenure" name="land_tenure" defaultValue={property.land_tenure ?? ""} />
                <FormField label="Plot ratio" name="plot_ratio" type="number" defaultValue={property.plot_ratio ?? ""} />
                <FormField
                  label="Site area (sqft)"
                  name="site_area_sqft"
                  type="number"
                  defaultValue={property.site_area_sqft ?? ""}
                />
                <FormField
                  label="Site area (sqm)"
                  name="site_area_sqm"
                  type="number"
                  defaultValue={property.site_area_sqm ?? ""}
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Location</h2>
                    <p className="mt-0.5 text-sm text-slate-600">{locationSummary}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 group-open:hidden">
                    Expand to edit
                  </span>
                  <span className="hidden shrink-0 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 group-open:inline">
                    Collapse
                  </span>
                </summary>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Building address</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField label="Country" name="country" defaultValue={property.country ?? ""} />
                    <FormField label="City (EN)" name="city_en" defaultValue={property.city_en ?? ""} />
                    <FormField label="District (EN)" name="district_en" defaultValue={property.district_en ?? ""} />
                    <FormField label="Street no." name="street_no" defaultValue={property.street_no ?? ""} />
                    <FormField label="Street (EN)" name="street_name_en" defaultValue={property.street_name_en ?? ""} />
                  </div>

                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full address (auto)</p>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">EN</p>
                        <p className="mt-0.5 text-sm text-slate-800">{addresses.en || "—"}</p>
                        <p className="mt-0.5 text-xs text-slate-500">Street no. Street, District, City</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Chinese</p>
                        <p className="mt-0.5 text-sm text-slate-800">{addresses.zh || "—"}</p>
                        <p className="mt-0.5 text-xs text-slate-500">City | District | Street + Street no. + 號</p>
                      </div>
                    </div>
                  </div>

                  <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-800">Chinese Address (ZH/CN)</summary>
                    <div className="mt-3 space-y-4">
                      <div className="grid gap-4 lg:grid-cols-3">
                        <FormField label="City (ZH)" name="city_zh" defaultValue={property.city_zh ?? ""} />
                        <FormField label="District (ZH)" name="district_zh" defaultValue={property.district_zh ?? ""} />
                        <FormField label="Street (ZH)" name="street_name_zh" defaultValue={property.street_name_zh ?? ""} />
                      </div>
                      <div className="grid gap-4 lg:grid-cols-3">
                        <FormField label="City (CN)" name="city_cn" defaultValue={property.city_cn ?? ""} />
                        <FormField label="District (CN)" name="district_cn" defaultValue={property.district_cn ?? ""} />
                        <FormField label="Street (CN)" name="street_name_cn" defaultValue={property.street_name_cn ?? ""} />
                      </div>
                    </div>
                  </details>
                </div>
              </details>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Accessibility</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField label="MTR station" name="mtr_station" defaultValue={property.mtr_station ?? ""} />
                <FormField
                  label="Walking minutes"
                  name="walking_minutes"
                  type="number"
                  defaultValue={property.walking_minutes?.toString() ?? ""}
                />
                <FormField
                  label="Green certification"
                  name="green_certification"
                  defaultValue={property.green_certification ?? ""}
                />
              </div>
              <div className="mt-4">
                <TextAreaField label="Facilities" name="facilities" defaultValue={property.facilities ?? ""} />
              </div>
            </section>
          </div>
          </form>
        </FormEditingContext.Provider>
      ) : (
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-slate-100" />}>
          <PropertiesV1Client
            propertyId={property.property_id}
            buildingName={property.bldg_name_en}
            premises={premises}
            companies={companies}
            contacts={contacts}
            propertyOptions={propertyOptions}
            drawerData={premisesDrawerData}
          />
        </Suspense>
      )}
    </div>
  );
}
