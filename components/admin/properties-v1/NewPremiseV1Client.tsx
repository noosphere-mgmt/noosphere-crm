"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPremisesV1Action } from "@/app/admin/properties/actions";
import { ModuleStickyEditBar } from "@/components/admin/ModuleActionBar";
import { PremisesV1EditForm } from "@/components/admin/properties-v1/PremisesDrawer";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { toCompanyV1SelectOptions } from "@/lib/companyV1Display";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

const selectClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900";

function emptyPremisesV1(propertyId: string): PremisesV1 {
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  return {
    premises_id: "",
    business_id: null,
    property_id: propertyId,
    property_name_en: null,
    property_name_en_is_custom: false,
    property_name_zh: null,
    property_name_zh_is_custom: false,
    property_name_cn: null,
    property_name_cn_is_custom: false,
    property_type: null,
    centre_type: null,
    property_category: null,
    asset_class: "commercial",
    asset_scope: "unit",
    product_subtype: "conventional_office",
    whole_asset_type: null,
    market_mode: "lease",
    occupancy_status: "unknown",
    availability_status: "available",
    discovery_status: "identified",
    access_status: "no_contact",
    source_type: "direct",
    address_confidence: "building_confirmed",
    last_verified_at: null,
    space_form: null,
    listing_intent: null,
    inventory_status: null,
    ownership_type: null,
    floor: null,
    unit: null,
    workstation_count: null,
    office_name: null,
    office_type: null,
    gross_area_sqft: null,
    net_area_sqft: null,
    view_type: null,
    windows: null,
    management_fee: null,
    management_fee_psf: null,
    government_rates: null,
    remarks: null,
    owner_company_id: null,
    landlord_company_id: null,
    current_tenant_company_id: null,
    operator_company_id: null,
    source_company_id: null,
    source_contact_id: null,
    source_contact_role: null,
    offer_type: null,
    offer_status: null,
    capacity_pax: null,
    offers_unique_address: null,
    offers_stamp_duty: null,
    price_pax_mth_unique_address: null,
    price_pax_yr_unique_address: null,
    price_pax_mth_workstation: null,
    price_pax_yr_workstation: null,
    price_pax_mth_room_window: null,
    price_pax_yr_room_window: null,
    price_pax_mth_room_internal: null,
    price_pax_yr_room_internal: null,
    monthly_rent: null,
    rent_psf: null,
    deposit_months: null,
    rent_free_period: null,
    contract_term_months: null,
    available_date: today,
    commission_rate: null,
    currency: "HKD",
    asking_sale_price: null,
    sale_price_psf: null,
    negotiable_sale_price: null,
    negotiable_sale_price_psf: null,
    expected_commission: null,
    payout_commission: null,
    commission_remarks: null,
    source_file: null,
    source_url: null,
    operating_model: null,
    fit_out_condition: null,
    relationship_lines: null,
    last_verified_date: today,
    listing_remarks: null,
    updated_at: "",
  };
}

export function NewPremiseV1Client({
  properties,
  companies,
  contacts,
}: {
  properties: PropertyV1[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetPropertyId = searchParams.get("property_id")?.trim() ?? "";
  const presetProperty = properties.find((p) => p.property_id === presetPropertyId);
  const theme = moduleAccentClasses("properties");
  const [propertyId, setPropertyId] = useState(
    presetProperty?.property_id ?? properties[0]?.property_id ?? "",
  );
  const premises = useMemo(() => emptyPremisesV1(propertyId), [propertyId]);
  const companyOptions = useMemo(() => toCompanyV1SelectOptions(companies), [companies]);
  const formId = "premises-form-new";
  const returnTo = presetPropertyId
    ? `/admin/properties/buildings?property=${encodeURIComponent(presetPropertyId)}&mode=view`
    : "/admin/properties";
  const backHref = returnTo;
  const backLabel = presetPropertyId ? "← Building" : "← All Premises";

  if (properties.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
        <p className="font-semibold">Add a building first</p>
        <p className="mt-2">Premises must be linked to a building in Properties. Create a building, then return here.</p>
        <Link href="/admin/properties/buildings/new" className={`mt-4 inline-block ${theme.primaryButton}`}>
          New
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-14">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
        <div className="min-w-0">
          <Link href={backHref} className={`text-xs ${theme.link}`}>
            {backLabel}
          </Link>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">New premise</h1>
          <p className="mt-1 text-sm text-slate-600">Add a premises line to an existing building.</p>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <label className="block text-sm font-medium text-slate-700">
          Building
          <select
            className={selectClass}
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
          >
            {properties.map((p) => (
              <option key={p.property_id} value={p.property_id}>
                {p.bldg_name_en?.trim() || p.property_id}
                {p.district_en ? ` · ${p.district_en}` : ""}
              </option>
            ))}
          </select>
        </label>
      </section>

      {propertyId ? (
        <PremisesV1EditForm
          isNew
          premises={premises}
          propertyId={propertyId}
          createAction={createPremisesV1Action}
          companyOptions={companyOptions}
          contacts={contacts}
          returnTo={returnTo}
        />
      ) : null}
      <ModuleStickyEditBar
        formId={formId}
        saveLabel="Create premise"
        onCancel={() => router.push(returnTo)}
      />
    </div>
  );
}
