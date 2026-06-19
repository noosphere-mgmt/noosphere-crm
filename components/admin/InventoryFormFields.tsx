import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { INVENTORY_STATUSES, LEGACY_LISTING_INTENTS, OFFER_TYPES } from "@/lib/lookups";
import type { Asset, Inventory } from "@/lib/types/entities";

const selectClass = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

type Props = {
  spaces: Array<{ id: number; building_id: number; property_id: number | null; label: string }>;
  operators: Array<{ id: number; name: string }>;
  defaults?: Inventory;
  selectedSpace?: Asset | null;
};

export function OfferFormFields({ spaces, operators, defaults, selectedSpace }: Props) {
  const space = selectedSpace;

  return (
    <>
      <label className="block text-sm font-medium text-slate-700">
        Property (space)
        <select
          name="asset_id"
          required
          defaultValue={defaults?.asset_id?.toString() ?? ""}
          className={selectClass}
        >
          <option value="">Select space</option>
          {spaces.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </label>
      {space ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900">{space.display_name_en}</p>
          <p className="mt-1">
            {space.building_name ? `${space.building_name} · ` : ""}
            {[space.floor, space.unit, space.suite].filter(Boolean).join(" · ") || "—"}
            {space.net_area_sqft ? ` · ${space.net_area_sqft} sq ft net` : ""}
          </p>
        </div>
      ) : null}
      <label className="block text-sm font-medium text-slate-700">
        Operator (optional)
        <select
          name="operator_id"
          defaultValue={defaults?.operator_id?.toString() ?? ""}
          className={selectClass}
        >
          <option value="">— None —</option>
          {operators.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Offer type
          <select name="offer_type" defaultValue={defaults?.offer_type ?? "Unit"} className={selectClass} required>
            {OFFER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Listing intent
          <select name="listing_intent" defaultValue={defaults?.listing_intent ?? "lease"} className={selectClass}>
            {LEGACY_LISTING_INTENTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Offer status
          <select name="status" defaultValue={defaults?.status ?? "available"} className={selectClass}>
            {INVENTORY_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pricing & terms</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Monthly rent / fee" name="monthly_rent" type="number" defaultValue={defaults?.monthly_rent ?? ""} />
        <FormField label="Rent PSF" name="rent_psf" type="number" defaultValue={defaults?.rent_psf ?? ""} />
        <FormField label="Management fee" name="management_fee" type="number" defaultValue={defaults?.management_fee ?? ""} />
        <FormField label="Government rates" name="government_rates" type="number" defaultValue={defaults?.government_rates ?? ""} />
        <FormField label="Deposit (months)" name="deposit_months" type="number" defaultValue={defaults?.deposit_months?.toString() ?? ""} />
        <FormField label="Rent-free period" name="rent_free_period" defaultValue={defaults?.rent_free_period ?? ""} />
        <FormField label="Contract term (months)" name="contract_term_months" type="number" defaultValue={defaults?.contract_term_months?.toString() ?? ""} />
        <FormField label="Available date" name="available_date" type="date" defaultValue={defaults?.available_date?.slice(0, 10) ?? ""} />
        <FormField label="Sale price" name="sale_price" type="number" defaultValue={defaults?.sale_price ?? ""} />
        <FormField label="Commission rate (e.g. 0.1 = 10%)" name="commission_rate" type="number" defaultValue={defaults?.commission_rate ?? ""} />
        <FormField label="Source file" name="source_file" defaultValue={defaults?.source_file ?? ""} />
      </div>
      <TextAreaField label="Offer remarks" name="remarks" defaultValue={defaults?.remarks ?? ""} />
    </>
  );
}

/** @deprecated use OfferFormFields */
export const InventoryFormFields = OfferFormFields;
