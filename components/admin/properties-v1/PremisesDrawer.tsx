"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PremisesRelationshipsEditor } from "@/components/admin/PremisesRelationshipsEditor";
import { FormEditingContext, ModuleActionBar } from "@/components/admin/ModuleActionBar";
import { SelectField } from "@/components/admin/AdminFormFields";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { buildCompanyV1LabelMap, toCompanyV1SelectOptions } from "@/lib/companyV1Display";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import {
  CANONICAL_LISTING_INTENT_LABELS,
  CANONICAL_LISTING_INTENTS,
  PREMISES_ASSET_CLASSES,
  PREMISES_AVAILABILITY_STATUSES,
  PREMISES_MARKET_MODES,
  PREMISES_PRODUCT_SUBTYPES,
  PREMISES_SOURCE_TYPES,
  PREMISES_WHOLE_ASSET_TYPES,
  PROPERTY_CATEGORIES,
  SPACE_FORMS,
  V1_DEPOSIT_MONTHS,
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_OFFICE_TYPES,
  V1_OPERATING_MODELS,
  V1_PROPERTY_TYPES,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";
import { useIsMobile } from "@/lib/useIsMobile";
import { premisesWorkspaceHref } from "@/lib/premisesWorkspaceNav";
import { buildPremisesReturnTo } from "@/lib/premisesDrawerNav";
import { PremisesDrawerBody } from "@/components/admin/properties-v1/PremisesDrawerBody";
import { PremisesDetailTabs } from "@/components/admin/properties-v1/PremisesDetailTabs";
import { PremisesDrawerHeader } from "@/components/admin/properties-v1/PremisesDrawerHeader";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import {
  formatPremisesName,
  isOfficePremisesPropertyType,
  parsePremisesViewTypes,
} from "@/lib/premisesDisplay";
import { formatPremisesBuildingLabel } from "@/lib/premisesDetailDisplay";
import { countPremisesRelationships } from "@/lib/premisesRelationships";
import {
  asCompanyV1Options,
  asContactV1Options,
  normalizePremisesDrawerData,
  normalizePremisesV1Client,
} from "@/lib/premisesClientData";
import {
  isPackageOperatingModel,
  monthlyRentFieldLabel,
  packageFeesNote,
} from "@/lib/premisesCommercial";
import { normalizeListingIntent } from "@/lib/premisesListing";
import { parseSpaceForm } from "@/lib/premisesClassification";
import { V1_CURRENCIES } from "@/lib/formatCurrency";

const overlayViewClass =
  "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const overlayEditClass =
  "fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] transition-opacity";
const panelViewClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-xl max-md:bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:w-[56vw] lg:max-w-[72rem]";
const panelEditClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl max-md:bottom-[calc(3.5rem+env(safe-area-inset-bottom))] lg:w-[60vw] lg:max-w-[65vw]";
const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900";

export type PremisesDrawerMode = "view" | "edit";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input className={inputClass} name={name} type={type} step={type === "number" ? "0.01" : undefined} defaultValue={defaultValue ?? ""} />
    </label>
  );
}

const SQFT_PER_SQM = 10.7639;

function convertedArea(value: string, direction: "to_sqm" | "to_sqft"): string {
  if (!value.trim()) return "";
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) return "";
  const converted = direction === "to_sqm" ? number / SQFT_PER_SQM : number * SQFT_PER_SQM;
  return converted.toFixed(2);
}

function AreaConversionFields({
  kind,
  sqftDefault,
  sqmDefault,
}: {
  kind: "gross" | "net";
  sqftDefault?: string | null;
  sqmDefault?: string | null;
}) {
  const [sqft, setSqft] = useState(sqftDefault ?? "");
  const [sqm, setSqm] = useState(sqmDefault ?? (sqftDefault ? convertedArea(sqftDefault, "to_sqm") : ""));
  const title = kind === "gross" ? "Gross area" : "Net area";

  return (
    <>
      <label className="block text-sm font-medium text-slate-700">
        {title} (sq ft)
        <input
          className={inputClass}
          name={`${kind}_area_sqft`}
          type="number"
          step="0.01"
          value={sqft}
          onChange={(event) => {
            const next = event.target.value;
            setSqft(next);
            setSqm(convertedArea(next, "to_sqm"));
          }}
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        {title} (sq.m.)
        <input
          className={inputClass}
          name={`${kind}_area_sqm`}
          type="number"
          step="0.01"
          value={sqm}
          onChange={(event) => {
            const next = event.target.value;
            setSqm(next);
            setSqft(convertedArea(next, "to_sqft"));
          }}
        />
      </label>
    </>
  );
}

function Area({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea className={inputClass} name={name} rows={rows} defaultValue={defaultValue ?? ""} />
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

function ViewTypeMultiSelect({ defaultValue }: { defaultValue: string | null | undefined }) {
  const selected = new Set(parsePremisesViewTypes(defaultValue));
  return (
    <fieldset className="block text-sm font-medium text-slate-700 sm:col-span-2">
      <span className="mb-1 block">View type</span>
      <div className="mt-1 flex flex-wrap gap-2">
        {V1_VIEW_TYPES.map((view) => (
          <label
            key={view}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            <input
              type="checkbox"
              name="view_type"
              value={view}
              defaultChecked={selected.has(view)}
              className="rounded border-slate-300"
            />
            {view}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function PremisesEditForm({
  premises,
  propertyId,
  propertyOptions,
  action,
  createAction,
  isNew = false,
  companyOptions,
  contacts,
  returnTo,
}: {
  premises: PremisesV1;
  propertyId: string;
  propertyOptions?: PropertyV1SelectOption[];
  action?: (premisesId: string, propertyId: string, formData: FormData) => Promise<void>;
  createAction?: (propertyId: string, formData: FormData) => Promise<void>;
  isNew?: boolean;
  companyOptions: ReturnType<typeof toCompanyV1SelectOptions>;
  contacts: ContactV1Option[];
  returnTo?: string;
}) {
  const pid = premises.premises_id;
  const formId = isNew ? "premises-form-new" : `premises-form-${pid}`;
  const [linkedPropertyId, setLinkedPropertyId] = useState(propertyId || premises.property_id);
  const formAction = isNew
    ? createAction!.bind(null, linkedPropertyId)
    : action!.bind(null, pid, propertyId);
  const [productSubtype, setProductSubtype] = useState(premises.product_subtype ?? "conventional_office");
  const [listingIntent, setListingIntent] = useState(
    () => normalizeListingIntent(premises.inventory_status) ?? "",
  );
  const [assetClass, setAssetClass] = useState(premises.asset_class ?? "commercial");
  const [assetScope, setAssetScope] = useState(premises.asset_scope ?? "unit");
  const [marketMode, setMarketMode] = useState(
    premises.market_mode ?? (premises.listing_intent === "both" ? "lease_or_sale" : premises.listing_intent ?? "lease"),
  );
  const [propertyType, setPropertyType] = useState(() => premises.property_type ?? "");

  useEffect(() => {
    setListingIntent(normalizeListingIntent(premises.inventory_status) ?? "");
  }, [premises.premises_id, premises.inventory_status]);

  useEffect(() => {
    setPropertyType(premises.property_type ?? "");
  }, [premises.premises_id, premises.property_type]);

  useEffect(() => {
    setAssetClass(premises.asset_class ?? "commercial");
    setAssetScope(premises.asset_scope ?? "unknown");
    setProductSubtype(premises.product_subtype ?? "conventional_office");
    setMarketMode(premises.market_mode ?? (premises.listing_intent === "both" ? "lease_or_sale" : premises.listing_intent ?? "lease"));
  }, [premises.premises_id, premises.asset_class, premises.asset_scope, premises.product_subtype, premises.market_mode, premises.listing_intent]);

  useEffect(() => {
    setLinkedPropertyId(propertyId || premises.property_id);
  }, [propertyId, premises.property_id, premises.premises_id]);

  const showLeaseTerms = marketMode === "lease" || marketMode === "lease_or_sale";
  const showSaleTerms = marketMode === "sale" || marketMode === "lease_or_sale";
  const showOfficeType = isOfficePremisesPropertyType(propertyType);
  const productSubtypeOptions = PREMISES_PRODUCT_SUBTYPES[assetClass as keyof typeof PREMISES_PRODUCT_SUBTYPES] ?? PREMISES_PRODUCT_SUBTYPES.unknown;
  const legacyOperatingModel = productSubtype === "serviced_office"
    ? "Serviced Office"
    : productSubtype === "shared_sublet_office"
      ? "Shared Office"
      : productSubtype === "serviced_unit"
        ? "Serviced Apartment"
        : "Conventional";
  const rentLabel = monthlyRentFieldLabel(legacyOperatingModel);
  const feesNote = packageFeesNote(legacyOperatingModel);
  const packageFees = isPackageOperatingModel(legacyOperatingModel);
  const legacyListingIntent = marketMode === "lease_or_sale" ? "both" : marketMode === "lease" || marketMode === "sale" ? marketMode : "";
  const legacyInventoryStatus = marketMode === "sale" ? "For Sale" : marketMode === "lease" || marketMode === "lease_or_sale" ? "For Lease" : "";
  const officeProduct = ["conventional_office", "serviced_office", "shared_sublet_office"].includes(productSubtype);
  const conditionOptions = [...V1_FIT_OUT_CONDITIONS];

  return (
    <FormEditingContext.Provider value={true}>
      <form
        id={formId}
        action={formAction}
        className="space-y-3"
      >
        {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
        <input type="hidden" name="listing_intent" value={legacyListingIntent} />
        <input type="hidden" name="inventory_status" value={legacyInventoryStatus} />
        <input type="hidden" name="property_category" value={premises.property_category ?? ""} />
        <input type="hidden" name="offer_type" value={premises.offer_type ?? ""} />
        <input type="hidden" name="operating_model" value={legacyOperatingModel} />
        {propertyOptions && propertyOptions.length > 0 ? (
          <Card title="Building">
            <label className="block text-sm font-medium text-slate-700">
              Linked building
              <select
                className={inputClass}
                name="property_id"
                value={linkedPropertyId}
                onChange={(e) => setLinkedPropertyId(e.target.value)}
                required
              >
                {propertyOptions.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </Card>
        ) : null}
        <Card title="Market & availability">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <fieldset className="block text-sm font-medium text-slate-700">
              <legend>Market mode</legend>
              <input type="hidden" name="market_mode" value={marketMode} />
              <div className="mt-1 grid min-h-9 grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-300">
                {PREMISES_MARKET_MODES.map((option) => {
                  const checked = marketMode === option.value || marketMode === "lease_or_sale";
                  return <label key={option.value} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-normal">
                    <input type="checkbox" checked={checked} onChange={(event) => {
                      const lease = option.value === "lease" ? event.target.checked : marketMode === "lease" || marketMode === "lease_or_sale";
                      const sale = option.value === "sale" ? event.target.checked : marketMode === "sale" || marketMode === "lease_or_sale";
                      setMarketMode(lease && sale ? "lease_or_sale" : sale ? "sale" : "lease");
                    }} />
                    {option.label}
                  </label>;
                })}
              </div>
            </fieldset>
            <SelectField label="Listing Status" name="availability_status" defaultValue={premises.availability_status ?? "available"} options={[...PREMISES_AVAILABILITY_STATUSES]} />
            <input type="hidden" name="current_tenant_company_id" value={premises.current_tenant_company_id ?? ""} />
            <input type="hidden" name="occupancy_status" value={premises.occupancy_status ?? ""} />
            <SelectField label="Source Type" name="source_type" defaultValue={premises.source_type ?? "direct"} options={[...PREMISES_SOURCE_TYPES]} />
            <Field
              label="Last verified date"
              name="last_verified_date"
              type="date"
              defaultValue={premises.last_verified_date?.slice(0, 10) ?? ""}
            />
          </div>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <Card title="Premises identity & classification">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Premise Name (English)
                <input className={inputClass} name="property_name_en" defaultValue={premises.property_name_en ?? ""} placeholder="Generated from Building + Floor + Unit" />
                <span className="mt-1 block text-xs font-normal text-slate-500">Generated automatically; edit here to keep a custom name.</span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="物業名稱(繁)" name="property_name_zh" defaultValue={premises.property_name_zh} />
                <Field label="物业名称(简)" name="property_name_cn" defaultValue={premises.property_name_cn} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Asset class
                  <select className={inputClass} name="asset_class" value={assetClass} onChange={(e) => {
                    const next = e.target.value as keyof typeof PREMISES_PRODUCT_SUBTYPES;
                    setAssetClass(next);
                    setProductSubtype(PREMISES_PRODUCT_SUBTYPES[next]?.[0]?.value ?? "unknown");
                  }}>
                    {PREMISES_ASSET_CLASSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Space Form
                  <select className={inputClass} name="space_form" defaultValue={parseSpaceForm(premises.space_form ?? premises.offer_type) ?? "Unit (s)"} onChange={(event) => {
                    setAssetScope(event.target.value === "Enbloc" ? "whole_building" : event.target.value === "Land" ? "land" : "unit");
                  }}>
                    {SPACE_FORMS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <input type="hidden" name="asset_scope" value={assetScope} />
                <label className="block text-sm font-medium text-slate-700">
                  Product subtype
                  <select className={inputClass} name="product_subtype" value={productSubtype} onChange={(e) => setProductSubtype(e.target.value)}>
                    {productSubtypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {assetScope === "whole_building" ? (
                  <SelectField label="Whole asset type" name="whole_asset_type" defaultValue={premises.whole_asset_type ?? "unknown"} options={[...PREMISES_WHOLE_ASSET_TYPES]} />
                ) : <input type="hidden" name="whole_asset_type" value="" />}
                <SelectField
                  label="Fit out condition"
                  name="fit_out_condition"
                  defaultValue={premises.fit_out_condition ?? ""}
                  placeholder="— Select —"
                  options={conditionOptions}
                />
                <Field label="Floor" name="floor" defaultValue={premises.floor} />
                <Field label="Unit" name="unit" defaultValue={premises.unit} />
                <div className="sm:col-span-2">
                  <Field label="Source URL" name="source_url" defaultValue={premises.source_url} />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Size & view">
            <div className="grid gap-4 sm:grid-cols-2">
              <AreaConversionFields kind="gross" sqftDefault={premises.gross_area_sqft} sqmDefault={premises.gross_area_sqm} />
              <AreaConversionFields kind="net" sqftDefault={premises.net_area_sqft} sqmDefault={premises.net_area_sqm} />
              <Field label="No. of rooms" name="no_of_rooms" defaultValue={premises.no_of_rooms ?? premises.workstation_count} />
              <input type="hidden" name="workstation_count" value={premises.workstation_count ?? ""} />
              {officeProduct ? <Field label="Capacity (pax)" name="capacity_pax" type="number" defaultValue={premises.capacity_pax?.toString() ?? ""} /> : null}
              {!officeProduct ? <input type="hidden" name="capacity_pax" value={premises.capacity_pax?.toString() ?? ""} /> : null}
              <ViewTypeMultiSelect defaultValue={premises.view_type} />
              <div className="sm:col-span-2">
                <Area label="Premises remarks" name="remarks" defaultValue={premises.remarks} rows={3} />
              </div>
            </div>
          </Card>

          {showLeaseTerms ? (
          <Card title="Lease terms">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Currency" name="currency" defaultValue={premises.currency ?? "HKD"} options={[...V1_CURRENCIES]} />
              <Field label={rentLabel} name="monthly_rent" type="number" defaultValue={premises.monthly_rent} />
              <Field label="Rent PSF" name="rent_psf" type="number" defaultValue={premises.rent_psf} />
              <Field
                label="Management fee"
                name="management_fee"
                type="number"
                defaultValue={packageFees ? "0" : premises.management_fee}
              />
              <Field
                label="Mgmt fee psf"
                name="management_fee_psf"
                type="number"
                defaultValue={packageFees ? "0" : premises.management_fee_psf}
              />
              <Field
                label="Govt rates (month)"
                name="government_rates"
                type="number"
                defaultValue={packageFees ? "0" : premises.government_rates}
              />
              <SelectField label="Deposit" name="deposit_months" defaultValue={premises.deposit_months ?? ""} options={[...V1_DEPOSIT_MONTHS]} />
              <Field label="Rent-free period" name="rent_free_period" defaultValue={premises.rent_free_period} />
              <Field label="Contract term (months)" name="contract_term_months" type="number" defaultValue={premises.contract_term_months?.toString() ?? ""} />
              <Field label="Available date" name="available_date" type="date" defaultValue={premises.available_date?.slice(0, 10) ?? ""} />
              <div className="sm:col-span-2">
                <Area label="Listing remarks" name="listing_remarks" defaultValue={premises.listing_remarks} rows={3} />
              </div>
            </div>
            {feesNote ? <p className="mt-3 text-xs text-slate-500">{feesNote}</p> : null}
          </Card>
          ) : null}
          {!showLeaseTerms ? <input type="hidden" name="listing_remarks" value={premises.listing_remarks ?? ""} /> : null}

          {showSaleTerms ? (
          <Card title="Sale terms">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Currency" name="currency" defaultValue={premises.currency ?? "HKD"} options={[...V1_CURRENCIES]} />
              <Field label="Asking sale price" name="asking_sale_price" type="number" defaultValue={premises.asking_sale_price} />
              <Field label="Asking sale price PSF" name="sale_price_psf" type="number" defaultValue={premises.sale_price_psf} />
              <Field label="Negotiated sale price" name="negotiable_sale_price" type="number" defaultValue={premises.negotiable_sale_price} />
              <Field label="Negotiated sale price PSF" name="negotiable_sale_price_psf" type="number" defaultValue={premises.negotiable_sale_price_psf} />
            </div>
          </Card>
          ) : null}

          <Card title="Commission">
            <div className="mb-4 border-b border-slate-200 pb-4">
              <textarea className={inputClass} name="commission_remarks" defaultValue={premises.commission_remarks ?? ""} rows={2} aria-label="Commission" />
              <input type="hidden" name="expected_commission" value={premises.expected_commission ?? ""} />
              <input type="hidden" name="payout_commission" value={premises.payout_commission ?? ""} />
            </div>
            <PremisesRelationshipsEditor
              key={`${premises.premises_id}:${premises.updated_at}`}
              premises={premises}
              companyOptions={companyOptions}
              contacts={contacts}
            />
          </Card>

          <input type="hidden" name="discovery_status" value={premises.discovery_status ?? ""} />
          <input type="hidden" name="access_status" value={premises.access_status ?? ""} />
          <input type="hidden" name="address_confidence" value={premises.address_confidence ?? ""} />
        </div>
      </form>
    </FormEditingContext.Provider>
  );
}

export { PremisesEditForm as PremisesV1EditForm };

export function PremisesDrawer({
  premises,
  propertyId,
  buildingName,
  mode,
  onClose,
  onModeChange,
  action,
  companies,
  contacts,
  propertyOptions,
  drawerData,
  returnTo,
  drawerBasePath = "/admin/properties",
}: {
  premises: PremisesV1 | null;
  propertyId: string;
  buildingName: string | null;
  mode: PremisesDrawerMode;
  onClose: () => void;
  onModeChange: (mode: PremisesDrawerMode) => void;
  action: (premisesId: string, propertyId: string, formData: FormData) => Promise<void>;
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
  drawerData: PremisesDrawerData | null;
  returnTo?: string;
  drawerBasePath?: string;
}) {
  const isOpen = premises != null;
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const companyOptions = useMemo(() => toCompanyV1SelectOptions(asCompanyV1Options(companies)), [companies]);
  const companyLabels = useMemo(() => buildCompanyV1LabelMap(asCompanyV1Options(companies)), [companies]);
  const safeContacts = useMemo(() => asContactV1Options(contacts), [contacts]);
  const contactLabels = useMemo(
    () =>
      new Map(
        safeContacts.flatMap((c) => {
          const name = c.display_name?.trim() || c.contact_id;
          const entries: [string, string][] = [[c.contact_id, name]];
          if (c.business_id?.trim()) entries.push([c.business_id.trim(), name]);
          if (c.legacy_contact_id != null) entries.push([String(c.legacy_contact_id), name]);
          return entries;
        }),
      ),
    [safeContacts],
  );

  const title = useMemo(() => {
    if (!premises) return "";
    return formatPremisesName(buildingName, premises.floor, premises.unit);
  }, [premises, buildingName]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !premises) return null;

  const safePremises = normalizePremisesV1Client(premises);

  const isView = isMobile || mode === "view";
  const formId = `premises-form-${safePremises.premises_id}`;
  const data = normalizePremisesDrawerData(drawerData);
  const buildingSubtitle = formatPremisesBuildingLabel(
    buildingName,
    safePremises.property_id,
    propertyOptions,
  );
  const tabCounts = {
    relationships: countPremisesRelationships(safePremises),
    opportunities: data.proposed.length,
    fees: data.fees.lines.length,
  };
  const listingReturnTo = buildPremisesReturnTo(searchParams, drawerBasePath);
  const fullPageHref = premisesWorkspaceHref(safePremises, "overview", undefined, listingReturnTo);
  const fullEditHref = premisesWorkspaceHref(safePremises, "overview", "edit", listingReturnTo);

  return (
    <>
      <button
        className={isView ? overlayViewClass : overlayEditClass}
        onClick={onClose}
        aria-label="Close premises panel"
      />
      <aside
        className={isView ? panelViewClass : panelEditClass}
        role="dialog"
        aria-modal="true"
        aria-label={isView ? "View premises" : "Edit premises"}
      >
        <InlineEditProvider initialEditHighlight={isView} resetKey={safePremises.premises_id}>
        {isView ? (
          <PremisesDrawerHeader
            title={title}
            subtitle={buildingSubtitle}
            businessId={safePremises.business_id}
            onClose={onClose}
            fullPageHref={fullPageHref}
            fullEditHref={fullEditHref}
          />
        ) : (
          <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Edit premises</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
              <RecordBusinessId id={safePremises.business_id} className="mt-0.5 block" />
              <p className="mt-1 text-sm text-slate-600">{buildingSubtitle}</p>
            </div>
            <ModuleActionBar mode="edit" formId={formId} onCancel={() => onModeChange("view")} module="properties" />
          </div>
        )}

        {isView ? (
          <div className="shrink-0 bg-white px-4 pt-2 sm:px-5">
            <PremisesDetailTabs
              premisesId={safePremises.premises_id}
              counts={tabCounts}
              drawerBasePath={drawerBasePath}
            />
          </div>
        ) : null}

        <div className={`min-h-0 flex-1 overflow-y-auto ${isView ? "px-4 py-3 sm:px-5" : "px-4 py-4 sm:px-5"}`}>
          {isView ? (
            <PremisesDrawerBody
              premises={safePremises}
              buildingName={buildingName}
              drawerData={data}
              companyLabels={companyLabels}
              contactLabels={contactLabels}
              propertyOptions={propertyOptions}
              companies={asCompanyV1Options(companies)}
              contacts={safeContacts}
              onAddRelationship={() => onModeChange("edit")}
              drawerBasePath={drawerBasePath}
            />
          ) : (
            <PremisesEditForm
              premises={safePremises}
              propertyId={propertyId}
              propertyOptions={propertyOptions}
              action={action}
              companyOptions={companyOptions}
              contacts={safeContacts}
              returnTo={returnTo}
            />
          )}
        </div>
        </InlineEditProvider>
      </aside>
    </>
  );
}
