import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import {
  FITOUT_CONDITIONS,
  FURNITURE_OPTIONS,
  IT_NETWORK_OPTIONS,
  LISTING_INTENTS,
  MARKETABLE_PROPERTY_STATUSES,
  MEETING_ROOM_OPTIONS,
  MOVE_IN_STATUS_OPTIONS,
  OCCUPANCY_STATUSES,
  OFFICE_EQUIPMENT_OPTIONS,
  OPERATING_MODELS,
  PROPERTY_CATEGORIES,
  PROPERTY_VIEW_TYPES,
  PROPERTY_WINDOW_TYPES,
  RECEPTION_SERVICE_OPTIONS,
  SPACE_FORMS,
} from "@/lib/lookups";
import type { MarketableProperty } from "@/lib/types/entities";

const selectClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const cardClass = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";
const cardTitleClass = "mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500";
const fieldGridClass = "grid gap-4 sm:grid-cols-2";

type CompanyOption = { id: number; company_name: string };

type Props = {
  buildings: Array<{ id: number; label: string }>;
  operatorCompanies: CompanyOption[];
  landlordCompanies: CompanyOption[];
  tenantCompanies: CompanyOption[];
  defaults?: MarketableProperty;
};

function FormCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${cardClass} ${className}`}>
      <h2 className={cardTitleClass}>{title}</h2>
      {children}
    </section>
  );
}

function CompanySelect({
  label,
  name,
  companies,
  defaultValue,
}: {
  label: string;
  name: string;
  companies: CompanyOption[];
  defaultValue?: number | null;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select name={name} defaultValue={defaultValue?.toString() ?? ""} className={selectClass}>
        <option value="">— None —</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.company_name}
          </option>
        ))}
      </select>
    </label>
  );
}

function EnumSelect({
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  options: readonly string[];
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <select name={name} defaultValue={defaultValue ?? ""} className={selectClass} required={required}>
        {!required ? <option value="">— None —</option> : null}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MarketablePropertyFormFields({
  buildings,
  operatorCompanies,
  landlordCompanies,
  tenantCompanies,
  defaults,
}: Props) {
  const d = defaults;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <FormCard title="Location">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Building
            <select
              name="building_id"
              required
              defaultValue={d?.building_id?.toString() ?? ""}
              className={selectClass}
            >
              <option value="">Select building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <div className={fieldGridClass}>
            <FormField label="Floor" name="floor" defaultValue={d?.floor ?? ""} />
            <FormField label="Unit" name="unit" defaultValue={d?.unit ?? ""} />
            <FormField label="Area (sq ft)" name="area_sqft" type="number" defaultValue={d?.area_sqft ?? ""} />
            <FormField
              label="Capacity (pax)"
              name="capacity_pax"
              type="number"
              defaultValue={d?.capacity_pax?.toString() ?? ""}
            />
          </div>
        </div>
      </FormCard>

      <FormCard title="Classification">
        <div className={fieldGridClass}>
          <EnumSelect
            label="Property category"
            name="property_category"
            options={PROPERTY_CATEGORIES}
            defaultValue={d?.property_category ?? "Office"}
            required
          />
          <EnumSelect
            label="Operating model"
            name="operating_model"
            options={OPERATING_MODELS}
            defaultValue={d?.operating_model ?? "Conventional Space"}
            required
          />
          <EnumSelect
            label="Listing intent"
            name="listing_intent"
            options={LISTING_INTENTS}
            defaultValue={d?.listing_intent ?? "lease"}
            required
          />
          <EnumSelect
            label="Space form"
            name="space_form"
            options={SPACE_FORMS}
            defaultValue={d?.space_form ?? "Unit"}
            required
          />
          <EnumSelect
            label="Occupancy status"
            name="occupancy_status"
            options={OCCUPANCY_STATUSES}
            defaultValue={d?.occupancy_status}
          />
          <EnumSelect
            label="Listing status"
            name="status"
            options={MARKETABLE_PROPERTY_STATUSES}
            defaultValue={d?.status ?? "available"}
            required
          />
        </div>
      </FormCard>

      <FormCard title="Commercial" className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Asking rent" name="asking_rent" type="number" defaultValue={d?.asking_rent ?? ""} />
          <FormField
            label="Asking sale price"
            name="asking_sale_price"
            type="number"
            defaultValue={d?.asking_sale_price ?? ""}
          />
          <FormField label="Rent PSF" name="rent_psf" type="number" defaultValue={d?.rent_psf ?? ""} />
          <FormField
            label="Management fee"
            name="management_fee"
            type="number"
            defaultValue={d?.management_fee ?? ""}
          />
          <FormField
            label="Deposit (months)"
            name="deposit_months"
            type="number"
            defaultValue={d?.deposit_months?.toString() ?? ""}
          />
          <FormField label="Rent-free period" name="rent_free_period" defaultValue={d?.rent_free_period ?? ""} />
          <FormField
            label="Contract term (months)"
            name="contract_term_months"
            type="number"
            defaultValue={d?.contract_term_months?.toString() ?? ""}
          />
          <FormField
            label="Commission rate"
            name="commission_rate"
            type="number"
            defaultValue={d?.commission_rate ?? ""}
          />
          <FormField
            label="Available date"
            name="available_date"
            type="date"
            defaultValue={d?.available_date?.slice(0, 10) ?? ""}
          />
        </div>
      </FormCard>

      <FormCard title="Companies">
        <div className="space-y-4">
          <CompanySelect
            label="Operator"
            name="operator_company_id"
            companies={operatorCompanies}
            defaultValue={d?.operator_company_id}
          />
          <CompanySelect
            label="Landlord"
            name="landlord_company_id"
            companies={landlordCompanies}
            defaultValue={d?.landlord_company_id}
          />
          <CompanySelect
            label="Current tenant"
            name="current_tenant_company_id"
            companies={tenantCompanies}
            defaultValue={d?.current_tenant_company_id}
          />
        </div>
      </FormCard>

      <FormCard title="Move-in condition">
        <div className={fieldGridClass}>
          <EnumSelect label="Furniture" name="furniture" options={FURNITURE_OPTIONS} defaultValue={d?.furniture} />
          <EnumSelect
            label="Office equipment"
            name="office_equipment"
            options={OFFICE_EQUIPMENT_OPTIONS}
            defaultValue={d?.office_equipment}
          />
          <EnumSelect
            label="Meeting room"
            name="meeting_room"
            options={MEETING_ROOM_OPTIONS}
            defaultValue={d?.meeting_room}
          />
          <EnumSelect
            label="Reception service"
            name="reception_service"
            options={RECEPTION_SERVICE_OPTIONS}
            defaultValue={d?.reception_service}
          />
          <EnumSelect label="IT network" name="it_network" options={IT_NETWORK_OPTIONS} defaultValue={d?.it_network} />
          <EnumSelect
            label="Move-in status"
            name="move_in_status"
            options={MOVE_IN_STATUS_OPTIONS}
            defaultValue={d?.move_in_status}
          />
        </div>
      </FormCard>

      <FormCard title="View / specification">
        <div className="space-y-4">
          <div className={fieldGridClass}>
            <EnumSelect
              label="View type"
              name="view_type"
              options={PROPERTY_VIEW_TYPES}
              defaultValue={d?.view_type}
            />
            <EnumSelect
              label="Window type"
              name="window_type"
              options={PROPERTY_WINDOW_TYPES}
              defaultValue={d?.window_type}
            />
            <EnumSelect
              label="Fit-out condition"
              name="fitout_condition"
              options={FITOUT_CONDITIONS}
              defaultValue={d?.fitout_condition}
            />
          </div>
          <TextAreaField label="Specification" name="specification" defaultValue={d?.specification ?? ""} />
        </div>
      </FormCard>

      <FormCard title="Source & remarks">
        <div className="space-y-4">
          <div className={fieldGridClass}>
            <FormField label="Source" name="source" defaultValue={d?.source ?? ""} />
            <FormField
              label="Source date"
              name="source_date"
              type="date"
              defaultValue={d?.source_date?.slice(0, 10) ?? ""}
            />
            <FormField
              label="Last updated"
              name="last_updated_date"
              type="date"
              defaultValue={d?.last_updated_date?.slice(0, 10) ?? ""}
            />
          </div>
          <TextAreaField label="Remarks" name="remarks" defaultValue={d?.remarks ?? ""} rows={4} />
          {d?.legacy_asset_id ? (
            <p className="text-xs text-slate-500">
              Legacy links: asset #{d.legacy_asset_id}
              {d.legacy_inventory_id ? ` · inventory #${d.legacy_inventory_id}` : ""}
            </p>
          ) : null}
        </div>
      </FormCard>
    </div>
  );
}
