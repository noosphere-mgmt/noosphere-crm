"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { composeAddressChinese, composeAddressEnglish, hasAddressParts } from "@/lib/composeAddress";
import { BUILDING_GRADES, BUILDING_TITLES, PROPERTY_TYPES } from "@/lib/lookups";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";
import { toCompanyV1SelectOptions } from "@/lib/companyV1Display";
import { BuildingRelationshipsEditor } from "@/components/admin/properties-v1/BuildingRelationships";
import { FormField, SelectField, TextAreaField } from "@/components/admin/AdminFormFields";
import { FormEditingContext } from "@/components/admin/ModuleActionBar";
import { createPropertyV1Action, updatePropertyV1Action } from "@/app/admin/properties/actions";

const SQFT_PER_SQM = 10.7639;

function convertArea(value: string, direction: "to_sqm" | "to_sqft"): string {
  if (!value.trim()) return "";
  const number = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(number)) return "";
  return (direction === "to_sqm" ? number / SQFT_PER_SQM : number * SQFT_PER_SQM).toFixed(2);
}

function AreaConversionFormFields({
  label,
  fieldPrefix,
  initialSqft,
  initialSqm,
}: {
  label: string;
  fieldPrefix: "bldg_area" | "site_area";
  initialSqft: string | null;
  initialSqm: string | null;
}) {
  const [sqft, setSqft] = useState(initialSqft ?? "");
  const [sqm, setSqm] = useState(initialSqm ?? (initialSqft ? convertArea(initialSqft, "to_sqm") : ""));

  return (
    <>
      <FormField
        label={`${label} (sq.ft.)`}
        name={`${fieldPrefix}_sqft`}
        type="number"
        value={sqft}
        onChange={(event) => {
          const next = event.target.value;
          setSqft(next);
          setSqm(convertArea(next, "to_sqm"));
        }}
      />
      <FormField
        label={`${label} (sq.m.)`}
        name={`${fieldPrefix}_sqm`}
        type="number"
        value={sqm}
        onChange={(event) => {
          const next = event.target.value;
          setSqm(next);
          setSqft(convertArea(next, "to_sqft"));
        }}
      />
    </>
  );
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
  const [, startTransition] = useTransition();
  const formId = formIdProp ?? (isNew ? "property-form-new" : `property-form-${property.property_id}`);
  const saveAction = useMemo(
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
    formRef.current?.requestSubmit();
  }, []);

  const handleSubmit = useCallback(
    (form: HTMLFormElement) => {
      syncHiddenAddresses(form);
      const formData = new FormData(form);
      startTransition(() => {
        void saveAction(formData);
      });
    },
    [saveAction],
  );

  useEffect(() => {
    onRegisterSubmit?.(submitForm);
  }, [onRegisterSubmit, submitForm]);

  useEffect(() => {
    syncAddresses();
  }, [syncAddresses]);

  const sectionCardClass =
    "min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4";
  const sectionTitleClass =
    "mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm";
  const fieldGridClass = "grid grid-cols-2 gap-x-3 gap-y-2.5";
  const detailGridClass = "grid grid-cols-1 gap-3 lg:grid-cols-2";

  return (
    <FormEditingContext.Provider value={true}>
      <form
        id={formId}
        ref={formRef}
        className="w-full"
        onInput={syncAddresses}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e.currentTarget);
        }}
      >
        {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
        <input type="hidden" name="full_address_en" defaultValue={initialAddresses(property).en} />
        <input type="hidden" name="full_address_zh" defaultValue={initialAddresses(property).zh} />
        <input type="hidden" name="full_address_cn" defaultValue={property.full_address_cn ?? ""} />
        <input type="hidden" name="bldg_name_zh" defaultValue={property.bldg_name_zh ?? ""} />
        <input type="hidden" name="bldg_name_cn" defaultValue={property.bldg_name_cn ?? ""} />
        <input type="hidden" name="bldg_desc_zh" defaultValue={property.bldg_desc_zh ?? ""} />
        <input type="hidden" name="bldg_desc_cn" defaultValue={property.bldg_desc_cn ?? ""} />
        <input type="hidden" name="city_zh" defaultValue={property.city_zh ?? ""} />
        <input type="hidden" name="city_cn" defaultValue={property.city_cn ?? ""} />
        <input type="hidden" name="district_zh" defaultValue={property.district_zh ?? ""} />
        <input type="hidden" name="district_cn" defaultValue={property.district_cn ?? ""} />
        <input type="hidden" name="street_name_zh" defaultValue={property.street_name_zh ?? ""} />
        <input type="hidden" name="street_name_cn" defaultValue={property.street_name_cn ?? ""} />
        <input type="hidden" name="location_advantages_zh" defaultValue={property.location_advantages_zh ?? ""} />
        <input type="hidden" name="location_advantages_cn" defaultValue={property.location_advantages_cn ?? ""} />
        <input type="hidden" name="proposal_highlights_zh" defaultValue={property.proposal_highlights_zh ?? ""} />
        <input type="hidden" name="proposal_highlights_cn" defaultValue={property.proposal_highlights_cn ?? ""} />
        <input type="hidden" name="facilities_zh" defaultValue={property.facilities_zh ?? ""} />
        <input type="hidden" name="facilities_cn" defaultValue={property.facilities_cn ?? ""} />
        <input type="hidden" name="building_remarks" defaultValue={property.building_remarks ?? ""} />
        <input type="hidden" name="mtr_station" defaultValue={property.mtr_station ?? ""} />
        <input type="hidden" name="walking_minutes" defaultValue={property.walking_minutes?.toString() ?? ""} />
        <input type="hidden" name="owner_company_id" defaultValue={property.owner_company_id ?? ""} />
        <input type="hidden" name="management_company_id" defaultValue={property.management_company_id ?? ""} />
        <input type="hidden" name="operator_company_id" defaultValue={property.operator_company_id ?? ""} />
        <input type="hidden" name="current_tenant_company_id" defaultValue={property.current_tenant_company_id ?? ""} />
        <input type="hidden" name="tower_block" defaultValue={property.tower_block ?? ""} />
        <input type="hidden" name="green_certification" defaultValue={property.green_certification ?? ""} />

        <div className={detailGridClass}>
          <section className={`${sectionCardClass} lg:col-span-2`}>
            <h2 className={sectionTitleClass}>Building</h2>
            <div>
              <FormField label="Building name (EN)" name="bldg_name_en" defaultValue={property.bldg_name_en ?? ""} />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Building specification</h2>
            <div className={fieldGridClass}>
              <SelectField label="Building Type" name="building_type" defaultValue={property.building_type ?? ""} options={PROPERTY_TYPES} />
              <SelectField label="Grade" name="grade" defaultValue={property.grade ?? ""} options={BUILDING_GRADES} />
              <FormField label="Year built" name="year_built" type="number" defaultValue={property.year_built?.toString() ?? ""} />
              <FormField label="Total Floors" name="floor_count" type="number" defaultValue={property.floor_count?.toString() ?? ""} />
              <AreaConversionFormFields label="Gross Area" fieldPrefix="bldg_area" initialSqft={property.bldg_area_sqft} initialSqm={property.bldg_area_sqm} />
              <div className="sm:col-span-2">
                <SelectField label="Title" name="title" defaultValue={property.title ?? ""} options={BUILDING_TITLES} />
              </div>
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Site</h2>
            <div className={fieldGridClass}>
              <FormField label="Lot number" name="lot_number" defaultValue={property.lot_number ?? ""} />
              <FormField label="Land Use / Zoning" name="land_use" defaultValue={property.land_use ?? ""} />
              <FormField label="Class of site" name="class_of_site" defaultValue={property.class_of_site ?? ""} />
              <FormField label="Land tenure" name="land_tenure" defaultValue={property.land_tenure ?? ""} />
              <FormField label="Plot ratio" name="plot_ratio" type="number" defaultValue={property.plot_ratio ?? ""} />
              <AreaConversionFormFields label="Site area" fieldPrefix="site_area" initialSqft={property.site_area_sqft} initialSqm={property.site_area_sqm} />
            </div>
          </section>

          <section className={`${sectionCardClass} lg:col-span-2`}>
            <h2 className={sectionTitleClass}>Relationships</h2>
            <BuildingRelationshipsEditor value={property.building_relationship_lines} companyOptions={companyOptions} />
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Location</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Country" name="country" defaultValue={property.country ?? ""} />
              <FormField label="City (EN)" name="city_en" defaultValue={property.city_en ?? ""} />
              <FormField label="District (EN)" name="district_en" defaultValue={property.district_en ?? ""} />
              <FormField label="Street (EN)" name="street_name_en" defaultValue={property.street_name_en ?? ""} />
              <FormField label="Street no." name="street_no" defaultValue={property.street_no ?? ""} />
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full address (auto)</p>
              <p className="mt-2 text-sm text-slate-800">{addresses.en || ""}</p>
              {addresses.zh ? <p className="mt-1 text-sm text-slate-600">{addresses.zh}</p> : null}
            </div>
          </section>

          <section className={sectionCardClass}>
            <h2 className={sectionTitleClass}>Proposal content</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextAreaField label="Building Introduction" name="bldg_desc" defaultValue={property.bldg_desc ?? ""} />
              <TextAreaField label="Location Highlights" name="location_advantages_en" defaultValue={property.location_advantages_en ?? ""} />
              <TextAreaField label="Accessibility &amp; Transport" name="proposal_highlights_en" defaultValue={property.proposal_highlights_en ?? ""} />
              <TextAreaField label="Facilities &amp; Amenities" name="facilities" defaultValue={property.facilities ?? ""} />
            </div>
          </section>
        </div>
      </form>
    </FormEditingContext.Provider>
  );
}

export function propertyFormId(property: PropertyV1): string {
  return property.property_id ? `property-form-${property.property_id}` : "property-form-new";
}
