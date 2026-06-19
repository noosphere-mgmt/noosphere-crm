"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CancelLink, FormField, SubmitButton, TextAreaField } from "@/components/admin/AdminFormFields";
import {
  ASSET_TYPES,
  BUILDING_GRADES,
  LEGACY_LISTING_INTENTS,
  MARKETABLE_PROPERTY_STATUSES,
  OFFER_TYPES,
} from "@/lib/lookups";
import type { Building, MarketableProperty } from "@/lib/types/entities";

const selectClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const sectionClass = "space-y-4 rounded-xl border border-slate-200 bg-white p-5";
const legendClass = "text-sm font-semibold text-slate-900";

type EntityMode = "existing" | "new";

function ModeToggle({ name, value, onChange }: { name: string; value: EntityMode; onChange: (m: EntityMode) => void }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <label className="inline-flex items-center gap-2 font-medium text-slate-700">
        <input type="radio" name={name} value="existing" checked={value === "existing"} onChange={() => onChange("existing")} />
        Use existing
      </label>
      <label className="inline-flex items-center gap-2 font-medium text-slate-700">
        <input type="radio" name={name} value="new" checked={value === "new"} onChange={() => onChange("new")} />
        Create new
      </label>
    </div>
  );
}

function propertyOptionLabel(p: MarketableProperty): string {
  const loc = [p.floor, p.unit].filter(Boolean).join(" · ");
  const parts = [loc || p.operating_model, p.building_name].filter(Boolean);
  return parts.join(" · ") || `Property #${p.id}`;
}

export function QuickAddPropertyForm({
  buildings,
  properties,
  operatorCompanies,
  action,
}: {
  buildings: Building[];
  properties: MarketableProperty[];
  operatorCompanies: { id: number; company_name: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [buildingMode, setBuildingMode] = useState<EntityMode>(buildings.length > 0 ? "existing" : "new");
  const [propertyMode, setPropertyMode] = useState<EntityMode>(properties.length > 0 ? "existing" : "new");
  const [operatorMode, setOperatorMode] = useState<EntityMode>("existing");
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");

  const filteredProperties = useMemo(() => {
    if (propertyMode !== "existing" || !selectedBuildingId) return properties;
    return properties.filter((p) => String(p.building_id) === selectedBuildingId);
  }, [properties, propertyMode, selectedBuildingId]);

  return (
    <form action={action} className="max-w-3xl space-y-6">
      <p className="text-sm text-slate-600">
        <Link href="/admin/glossary" className="font-medium text-slate-900 underline">
          Building → Property → Listing terms
        </Link>
      </p>

      <fieldset className={sectionClass}>
        <legend className={`${legendClass} mb-3`}>1. Building</legend>
        <ModeToggle name="building_mode" value={buildingMode} onChange={setBuildingMode} />
        {buildingMode === "existing" ? (
          <label className="block text-sm font-medium text-slate-700">
            Existing building
            <select
              name="building_id"
              required={buildingMode === "existing"}
              className={selectClass}
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
            >
              <option value="">Select building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name_en}
                  {b.district ? ` · ${b.district}` : ""}
                  {b.tower_block ? ` · ${b.tower_block}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="space-y-4">
            <FormField label="Building name (EN)" name="name_en" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="District" name="district" required />
              <FormField label="Full address (EN)" name="full_address_en" />
              <FormField label="Tower / block" name="tower_block" />
              <label className="block text-sm font-medium text-slate-700">
                Building grade
                <select name="grade" defaultValue="" className={selectClass}>
                  <option value="">— None —</option>
                  {BUILDING_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
              <FormField label="Nearest MTR" name="mtr_station" />
              <FormField label="No. of floors" name="floor_count" type="number" />
            </div>
          </div>
        )}
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className={`${legendClass} mb-3`}>2. Property (space)</legend>
        <ModeToggle name="property_mode" value={propertyMode} onChange={setPropertyMode} />
        {propertyMode === "existing" ? (
          <label className="block text-sm font-medium text-slate-700">
            Existing property
            <select name="property_id" required={propertyMode === "existing"} className={selectClass} defaultValue="">
              <option value="">Select property</option>
              {filteredProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {propertyOptionLabel(p)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Space type
              <select name="space_type" defaultValue="Unit" className={selectClass}>
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <FormField label="Floor" name="floor" />
            <FormField label="Unit / room" name="unit" />
            <FormField label="Suite" name="suite" />
            <FormField label="Area (sq ft)" name="area_sqft" type="number" />
            <FormField label="Capacity (pax)" name="capacity_pax" type="number" />
          </div>
        )}
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className={`${legendClass} mb-3`}>3. Operator (optional)</legend>
        <ModeToggle name="operator_mode" value={operatorMode} onChange={setOperatorMode} />
        {operatorMode === "existing" ? (
          <label className="block text-sm font-medium text-slate-700">
            Existing operator company
            <select name="operator_company_id" className={selectClass} defaultValue="">
              <option value="">— None —</option>
              {operatorCompanies.map((o) => (
                <option key={o.id} value={o.id}>{o.company_name}</option>
              ))}
            </select>
          </label>
        ) : (
          <FormField label="Operator company name" name="operator_name" />
        )}
      </fieldset>

      <fieldset className={sectionClass}>
        <legend className={`${legendClass} mb-3`}>4. Listing terms</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Offer type
            <select name="offer_type" defaultValue="Serviced Office" className={selectClass} required>
              {OFFER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Listing intent
            <select name="listing_intent" defaultValue="lease" className={selectClass}>
              {LEGACY_LISTING_INTENTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <FormField label="Asking rent / fee" name="asking_rent" type="number" />
          <FormField label="Asking sale price" name="asking_sale_price" type="number" />
          <FormField label="Available date" name="available_date" type="date" />
          <FormField label="Deposit (months)" name="deposit_months" type="number" />
          <FormField label="Contract term (months)" name="contract_term_months" type="number" />
          <FormField label="Commission rate" name="commission_rate" type="number" />
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Status
          <select name="status" defaultValue="available" className={selectClass}>
            {MARKETABLE_PROPERTY_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <TextAreaField label="Remarks" name="remarks" />
      </fieldset>

      <div className="flex items-center gap-4">
        <SubmitButton label="Save property" />
        <CancelLink href="/admin/properties" />
      </div>
    </form>
  );
}

/** @deprecated Use QuickAddPropertyForm */
export const QuickAddOfferForm = QuickAddPropertyForm;

/** @deprecated Use QuickAddPropertyForm */
export const QuickAddInventoryForm = QuickAddPropertyForm;
