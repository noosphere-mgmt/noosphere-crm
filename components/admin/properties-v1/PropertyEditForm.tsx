"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { composeAddressChinese, composeAddressEnglish, hasAddressParts } from "@/lib/composeAddress";
import { BUILDING_GRADES, BUILDING_TITLES } from "@/lib/lookups";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";
import { toCompanyV1SelectOptions } from "@/lib/companyV1Display";
import { CompanyConnectionFields } from "@/components/admin/CompanyConnectionFields";
import { FormField, SelectField, TextAreaField } from "@/components/admin/AdminFormFields";
import { FormEditingContext } from "@/components/admin/ModuleActionBar";
import { createPropertyV1Action, updatePropertyV1Action } from "@/app/admin/properties/actions";

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
  const composedEn = composeAddressEnglish(enParts);
  const composedZh = composeAddressChinese(zhParts);

  return {
    en: hasAddressParts(enParts) ? composedEn : property.full_address_en?.trim() || composedEn,
    zh: hasAddressParts(zhParts) ? composedZh : property.full_address_zh?.trim() || composedZh,
  };
}

export function PropertyEditForm({
  property,
  companies,
  returnTo,
  formId: formIdProp,
  onRegisterSubmit,
}: {
  property: PropertyV1;
  companies: CompanyV1Option[];
  returnTo?: string;
  formId?: string;
  onRegisterSubmit?: (submit: () => void) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !property.property_id;
  const [addresses, setAddresses] = useState(() => initialAddresses(property));
  const formId = formIdProp ?? (isNew ? "property-form-new" : `property-form-${property.property_id}`);
  const updatePropertyAction = useMemo(
    () =>
      isNew ? createPropertyV1Action : updatePropertyV1Action.bind(null, property.property_id),
    [isNew, property.property_id],
  );
  const companyOptions = useMemo(() => toCompanyV1SelectOptions(companies), [companies]);

  const syncAddresses = useCallback(() => {
    if (!formRef.current) return;
    const next = syncHiddenAddresses(formRef.current);
    setAddresses({ en: next.en, zh: next.zh });
  }, []);

  const submitForm = useCallback(() => {
    if (!formRef.current) return;
    syncHiddenAddresses(formRef.current);
    formRef.current.requestSubmit();
  }, []);

  useEffect(() => {
    onRegisterSubmit?.(submitForm);
  }, [onRegisterSubmit, submitForm]);

  useEffect(() => {
    syncAddresses();
  }, [syncAddresses]);

  const sectionCardClass =
    "min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-5";
  const sectionTitleClass =
    "mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:mb-4 md:text-sm";
  const fieldGridClass = "grid grid-cols-1 gap-3 md:gap-4";
  const detailGridClass = "grid grid-cols-2 gap-3 md:grid-cols-1 xl:grid-cols-2 md:gap-4";

  return (
    <FormEditingContext.Provider value={true}>
      <form
        id={formId}
        ref={formRef}
        action={updatePropertyAction}
        className="w-full"
        onInput={syncAddresses}
        onSubmit={() => {
          if (formRef.current) syncHiddenAddresses(formRef.current);
        }}
      >
        {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
        <input type="hidden" name="full_address_en" defaultValue={initialAddresses(property).en} />
        <input type="hidden" name="full_address_zh" defaultValue={initialAddresses(property).zh} />
        <input type="hidden" name="full_address_cn" defaultValue={property.full_address_cn ?? ""} />

        <div className={detailGridClass}>
          <section className={`${sectionCardClass} col-span-2`}>
            <h2 className={sectionTitleClass}>Building</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 md:gap-4">
              <FormField label="Building name (EN)" name="bldg_name_en" defaultValue={property.bldg_name_en ?? ""} />
              <FormField label="Building name (ZH)" name="bldg_name_zh" defaultValue={property.bldg_name_zh ?? ""} />
              <FormField label="Building name (CN)" name="bldg_name_cn" defaultValue={property.bldg_name_cn ?? ""} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Building specification</h2>
            <div className={fieldGridClass}>
              <FormField label="Year built" name="year_built" type="number" defaultValue={property.year_built?.toString() ?? ""} />
              <FormField label="No. of floors" name="floor_count" type="number" defaultValue={property.floor_count?.toString() ?? ""} />
              <FormField label="Building area (sq ft)" name="bldg_area_sqft" type="number" defaultValue={property.bldg_area_sqft ?? ""} />
              <FormField label="Building area (sqm)" name="bldg_area_sqm" type="number" defaultValue={property.bldg_area_sqm ?? ""} />
              <SelectField label="Grade" name="grade" defaultValue={property.grade ?? ""} options={BUILDING_GRADES} />
              <SelectField label="Title" name="title" defaultValue={property.title ?? ""} options={BUILDING_TITLES} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Site</h2>
            <div className={fieldGridClass}>
              <FormField label="Lot number" name="lot_number" defaultValue={property.lot_number ?? ""} />
              <FormField label="Land use" name="land_use" defaultValue={property.land_use ?? ""} />
              <FormField label="Class of site" name="class_of_site" defaultValue={property.class_of_site ?? ""} />
              <FormField label="Land tenure" name="land_tenure" defaultValue={property.land_tenure ?? ""} />
              <FormField label="Plot ratio" name="plot_ratio" type="number" defaultValue={property.plot_ratio ?? ""} />
              <FormField label="Site area (sqft)" name="site_area_sqft" type="number" defaultValue={property.site_area_sqft ?? ""} />
              <FormField label="Site area (sqm)" name="site_area_sqm" type="number" defaultValue={property.site_area_sqm ?? ""} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Companies</h2>
            <div className={`${fieldGridClass} [&_.grid]:grid-cols-1 [&_.grid]:sm:grid-cols-1`}>
              <CompanyConnectionFields defaults={property} companyOptions={companyOptions} showManagement={false} />
              <SelectField
                label="Management company"
                name="management_company_id"
                defaultValue={property.management_company_id ?? ""}
                placeholder="— Select company —"
                options={companyOptions}
              />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Building notes</h2>
            <div className={fieldGridClass}>
              <TextAreaField label="Building description" name="bldg_desc" defaultValue={property.bldg_desc ?? ""} />
              <TextAreaField label="Building remarks" name="building_remarks" defaultValue={property.building_remarks ?? ""} />
            </div>
          </section>

          <section className={`${sectionCardClass} col-span-2`}>
            <h2 className={sectionTitleClass}>Location</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Country" name="country" defaultValue={property.country ?? ""} />
              <FormField label="City (EN)" name="city_en" defaultValue={property.city_en ?? ""} />
              <FormField label="District (EN)" name="district_en" defaultValue={property.district_en ?? ""} />
              <FormField label="Street no." name="street_no" defaultValue={property.street_no ?? ""} />
              <FormField label="Street (EN)" name="street_name_en" defaultValue={property.street_name_en ?? ""} />
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full address (auto)</p>
              <p className="mt-2 text-sm text-slate-800">{addresses.en || "—"}</p>
              {addresses.zh ? <p className="mt-1 text-sm text-slate-600">{addresses.zh}</p> : null}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <FormField label="City (ZH)" name="city_zh" defaultValue={property.city_zh ?? ""} />
              <FormField label="District (ZH)" name="district_zh" defaultValue={property.district_zh ?? ""} />
              <FormField label="Street (ZH)" name="street_name_zh" defaultValue={property.street_name_zh ?? ""} />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <FormField label="City (CN)" name="city_cn" defaultValue={property.city_cn ?? ""} />
              <FormField label="District (CN)" name="district_cn" defaultValue={property.district_cn ?? ""} />
              <FormField label="Street (CN)" name="street_name_cn" defaultValue={property.street_name_cn ?? ""} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Accessibility</h2>
            <div className={fieldGridClass}>
              <FormField label="MTR station" name="mtr_station" defaultValue={property.mtr_station ?? ""} />
              <FormField label="Walking minutes" name="walking_minutes" type="number" defaultValue={property.walking_minutes?.toString() ?? ""} />
              <FormField label="Green certification" name="green_certification" defaultValue={property.green_certification ?? ""} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Facilities</h2>
            <TextAreaField label="Facilities" name="facilities" defaultValue={property.facilities ?? ""} />
          </section>
        </div>
      </form>
    </FormEditingContext.Provider>
  );
}

export function propertyFormId(property: PropertyV1): string {
  return property.property_id ? `property-form-${property.property_id}` : "property-form-new";
}
