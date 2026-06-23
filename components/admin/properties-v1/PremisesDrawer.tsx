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
  V1_DEPOSIT_MONTHS,
  V1_FIT_OUT_CONDITIONS,
  V1_LISTING_INTENTS,
  V1_LISTING_STATUSES,
  V1_OFFER_TYPES,
  V1_OFFICE_TYPES,
  V1_OPERATING_MODELS,
  V1_PROPERTY_TYPES,
  V1_VIEW_TYPES,
} from "@/lib/v1ListValues";
import { useIsMobile } from "@/lib/useIsMobile";
import { PremisesDrawerBody } from "@/components/admin/properties-v1/PremisesDrawerBody";
import { PremisesDetailTabs } from "@/components/admin/properties-v1/PremisesDetailTabs";
import { PremisesDrawerHeader } from "@/components/admin/properties-v1/PremisesDrawerHeader";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";
import { formatPremisesName } from "@/lib/premisesDisplay";
import { countPremisesRelationships } from "@/lib/premisesRelationships";
import {
  isPackageOperatingModel,
  monthlyRentFieldLabel,
  packageFeesNote,
} from "@/lib/premisesCommercial";
import { normalizeListingIntent } from "@/lib/premisesListing";
import { V1_CURRENCIES } from "@/lib/formatCurrency";

const overlayViewClass =
  "fixed inset-0 z-40 bg-slate-900/10 transition-opacity";
const overlayEditClass =
  "fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] transition-opacity";
const panelViewClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-slate-50 shadow-xl lg:w-[42vw] lg:max-w-[45vw]";
const panelEditClass =
  "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl lg:w-[60vw] lg:max-w-[65vw]";
const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900";

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
      <input className={inputClass} name={name} type={type} defaultValue={defaultValue ?? ""} />
    </label>
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
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
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
  const rentLabel = monthlyRentFieldLabel(premises.operating_model);
  const feesNote = packageFeesNote(premises.operating_model);
  const packageFees = isPackageOperatingModel(premises.operating_model);
  const [listingIntent, setListingIntent] = useState(
    () => normalizeListingIntent(premises.inventory_status) ?? "",
  );

  useEffect(() => {
    setListingIntent(normalizeListingIntent(premises.inventory_status) ?? "");
  }, [premises.premises_id, premises.inventory_status]);

  useEffect(() => {
    setLinkedPropertyId(propertyId || premises.property_id);
  }, [propertyId, premises.property_id, premises.premises_id]);

  const showLeaseTerms = listingIntent === "For Lease";
  const showSaleTerms = listingIntent === "For Sale";

  return (
    <FormEditingContext.Provider value={true}>
      <form
        id={formId}
        action={formAction}
        className="space-y-6"
      >
        {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}
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
        <Card title="Listing">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Listing Intent
              <select
                className={inputClass}
                name="inventory_status"
                value={listingIntent}
                onChange={(e) => setListingIntent(e.target.value)}
              >
                <option value="">— Select —</option>
                {V1_LISTING_INTENTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <SelectField
              label="Listing Status"
              name="offer_status"
              defaultValue={premises.offer_status ?? ""}
              placeholder="— Select —"
              options={[...V1_LISTING_STATUSES]}
            />
            <Field
              label="Last verified date"
              name="last_verified_date"
              type="date"
              defaultValue={premises.last_verified_date?.slice(0, 10) ?? ""}
            />
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Specification">
            <div className="space-y-4">
              <Field label="Property name (EN)" name="property_name_en" defaultValue={premises.property_name_en} />
              <Field label="Property name (ZH)" name="property_name_zh" defaultValue={premises.property_name_zh} />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Operating model"
                  name="operating_model"
                  defaultValue={premises.operating_model ?? ""}
                  placeholder="— Select —"
                  options={[...V1_OPERATING_MODELS]}
                />
                <SelectField
                  label="Fit out condition"
                  name="fit_out_condition"
                  defaultValue={premises.fit_out_condition ?? ""}
                  placeholder="— Select —"
                  options={[...V1_FIT_OUT_CONDITIONS]}
                />
                <SelectField
                  label="Property type"
                  name="property_type"
                  defaultValue={premises.property_type ?? ""}
                  options={[...V1_PROPERTY_TYPES]}
                />
                <SelectField
                  label="Office type"
                  name="office_type"
                  defaultValue={premises.office_type ?? ""}
                  options={[...V1_OFFICE_TYPES]}
                />
                <Field label="Floor" name="floor" defaultValue={premises.floor} />
                <Field label="Unit" name="unit" defaultValue={premises.unit} />
              </div>
            </div>
          </Card>

          <Card title="Size & view">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gross area (sq ft)" name="gross_area_sqft" type="number" defaultValue={premises.gross_area_sqft} />
              <Field label="Net area (sq ft)" name="net_area_sqft" type="number" defaultValue={premises.net_area_sqft} />
              <Field label="Workstation count" name="workstation_count" defaultValue={premises.workstation_count} />
              <Field label="Capacity (pax)" name="capacity_pax" type="number" defaultValue={premises.capacity_pax?.toString() ?? ""} />
              <SelectField
                label="View type"
                name="view_type"
                defaultValue={premises.view_type ?? ""}
                options={[...V1_VIEW_TYPES]}
              />
            </div>
          </Card>

          {showLeaseTerms ? (
          <Card title="Lease terms">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Currency" name="currency" defaultValue={premises.currency ?? "HKD"} options={[...V1_CURRENCIES]} />
              <SelectField label="Offer type" name="offer_type" defaultValue={premises.offer_type ?? ""} options={[...V1_OFFER_TYPES]} />
              <Field label={rentLabel} name="monthly_rent" type="number" defaultValue={premises.monthly_rent} />
              <Field label="Rent PSF" name="rent_psf" type="number" defaultValue={premises.rent_psf} />
              <Field
                label="Management fee"
                name="management_fee"
                type="number"
                defaultValue={packageFees ? "0" : premises.management_fee}
              />
              <Field
                label="Government rates"
                name="government_rates"
                type="number"
                defaultValue={packageFees ? "0" : premises.government_rates}
              />
              <SelectField label="Deposit" name="deposit_months" defaultValue={premises.deposit_months ?? ""} options={[...V1_DEPOSIT_MONTHS]} />
              <Field label="Rent-free period" name="rent_free_period" defaultValue={premises.rent_free_period} />
              <Field label="Contract term (months)" name="contract_term_months" type="number" defaultValue={premises.contract_term_months?.toString() ?? ""} />
              <Field label="Available date" name="available_date" type="date" defaultValue={premises.available_date?.slice(0, 10) ?? ""} />
            </div>
            {feesNote ? <p className="mt-3 text-xs text-slate-500">{feesNote}</p> : null}
          </Card>
          ) : null}

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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Expected commission" name="expected_commission" defaultValue={premises.expected_commission} />
              <Field label="Payout commission" name="payout_commission" defaultValue={premises.payout_commission} />
            </div>
            <div className="mt-4">
              <Area label="Commission remarks" name="commission_remarks" defaultValue={premises.commission_remarks} rows={3} />
            </div>
          </Card>

          <Card title="Relationships">
            <PremisesRelationshipsEditor premises={premises} companyOptions={companyOptions} contacts={contacts} />
          </Card>

          <Card title="Remarks">
            <div className="space-y-4">
              <Area label="Listing remarks" name="listing_remarks" defaultValue={premises.listing_remarks} rows={4} />
              <Area label="Premises remarks" name="remarks" defaultValue={premises.remarks} rows={4} />
            </div>
          </Card>
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
  const companyOptions = useMemo(() => toCompanyV1SelectOptions(companies), [companies]);
  const companyLabels = useMemo(() => buildCompanyV1LabelMap(companies), [companies]);
  const contactLabels = useMemo(
    () => new Map(contacts.map((c) => [c.contact_id, c.display_name])),
    [contacts],
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

  const isView = isMobile || mode === "view";
  const formId = `premises-form-${premises.premises_id}`;
  const emptyDrawerData: PremisesDrawerData = {
    proposed: [],
    fees: { expected_collect: 0, confirmed_collect: 0, paid_out: 0, net_fee: 0, lines: [] },
    activities: [],
    lastActivityDate: null,
  };
  const data = drawerData ?? emptyDrawerData;
  const buildingSubtitle =
    propertyOptions.find((p) => p.property_id === premises.property_id)?.label ?? buildingName ?? premises.property_id;
  const tabCounts = {
    relationships: countPremisesRelationships(premises),
    opportunities: data.proposed.length,
    fees: data.fees.lines.length,
  };

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
        <InlineEditProvider initialEditHighlight={isView} resetKey={premises.premises_id}>
        {isView ? (
          <PremisesDrawerHeader
            title={title}
            subtitle={buildingSubtitle}
            businessId={premises.premises_id}
            onClose={onClose}
            onEdit={() => onModeChange("edit")}
            onFullEdit={() => onModeChange("edit")}
            showEdit
          />
        ) : (
          <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Edit premises</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
              <span className="mt-0.5 block font-mono text-xs text-slate-500">{premises.premises_id}</span>
              <p className="mt-1 text-sm text-slate-600">{buildingSubtitle}</p>
            </div>
            <ModuleActionBar mode="edit" formId={formId} onCancel={() => onModeChange("view")} module="properties" />
          </div>
        )}

        {isView ? (
          <div className="shrink-0 bg-white px-4 pt-2 sm:px-5">
            <PremisesDetailTabs
              premisesId={premises.premises_id}
              counts={tabCounts}
              drawerBasePath={drawerBasePath}
            />
          </div>
        ) : null}

        <div className={`min-h-0 flex-1 overflow-y-auto ${isView ? "px-4 py-3 sm:px-5" : "px-4 py-4 sm:px-5"}`}>
          {isView ? (
            <PremisesDrawerBody
              premises={premises}
              buildingName={buildingName}
              drawerData={data}
              companyLabels={companyLabels}
              contactLabels={contactLabels}
              propertyOptions={propertyOptions}
              onAddRelationship={() => onModeChange("edit")}
              drawerBasePath={drawerBasePath}
            />
          ) : (
            <PremisesEditForm
              premises={premises}
              propertyId={propertyId}
              propertyOptions={propertyOptions}
              action={action}
              companyOptions={companyOptions}
              contacts={contacts}
              returnTo={returnTo}
            />
          )}
        </div>
        </InlineEditProvider>
      </aside>
    </>
  );
}
